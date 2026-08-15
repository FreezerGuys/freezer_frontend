import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { PNG } from 'pngjs'
import jsQR from 'jsqr'
import { describe, expect, it } from 'vitest'
import {
  QR_SCHEMA_ID,
  QR_SCHEMA_VERSION,
  decodeSamplePayload,
  encodeSamplePayload,
  SamplePayloadV1
} from './qr'
import { validateInventoryItem } from './validators'
import { NewInventoryItemInput } from '@/types/inventory'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const EXAMPLE_QR_DIR = path.resolve(__dirname, '../../public/Example_QR_Codes')

const samplePayload: SamplePayloadV1 = {
  name: 'Sodium Chloride Solution',
  company: 'Sigma-Aldrich',
  volume: '100ml',
  quantity: 5,
  purchaseDate: '2026-01-01',
  expirationDate: '2027-01-01',
  notes: '',
  category: '4C',
  qrCode: 'QR-TEST-0001'
}

/** Decodes every PNG in public/Example_QR_Codes to its raw QR text. */
function readExampleQrTexts(): Record<string, string> {
  const files = fs.readdirSync(EXAMPLE_QR_DIR).filter((f) => f.toLowerCase().endsWith('.png'))
  const texts: Record<string, string> = {}
  for (const file of files) {
    const png = PNG.sync.read(fs.readFileSync(path.join(EXAMPLE_QR_DIR, file)))
    const result = jsQR(new Uint8ClampedArray(png.data), png.width, png.height)
    if (!result) throw new Error(`Could not decode QR code from fixture ${file}`)
    texts[file] = result.data
  }
  return texts
}

describe('decodeSamplePayload - JSON envelope (app-generated labels)', () => {
  it('round-trips a payload through encode/decode', () => {
    const encoded = encodeSamplePayload(samplePayload)
    const decoded = decodeSamplePayload(encoded)
    expect(decoded).toEqual({ ok: true, data: samplePayload })
  })

  it('rejects a JSON payload with the wrong schema id', () => {
    const decoded = decodeSamplePayload(JSON.stringify({ schema: 'someone.else', v: 1, data: samplePayload }))
    expect(decoded).toEqual({
      ok: false,
      error: 'This QR code is not a ThermalHaven sample label.'
    })
  })

  it('rejects a JSON envelope with an unsupported version', () => {
    const decoded = decodeSamplePayload(
      JSON.stringify({ schema: QR_SCHEMA_ID, v: QR_SCHEMA_VERSION + 1, data: samplePayload })
    )
    expect(decoded).toEqual({ ok: false, error: `Unsupported sample label version (${QR_SCHEMA_VERSION + 1}).` })
  })

  it('rejects a JSON envelope missing its data field', () => {
    const decoded = decodeSamplePayload(JSON.stringify({ schema: QR_SCHEMA_ID, v: QR_SCHEMA_VERSION }))
    expect(decoded).toEqual({ ok: false, error: 'Sample label is missing data.' })
  })

  it('rejects garbage input that is not JSON or the legacy label format', () => {
    const decoded = decodeSamplePayload('not a qr code at all')
    expect(decoded).toEqual({
      ok: false,
      error: 'This QR code is not a ThermalHaven sample label.'
    })
  })
})

describe('decodeSamplePayload - legacy supplier labels (public/Example_QR_Codes)', () => {
  const texts = readExampleQrTexts()
  const filenames = Object.keys(texts).sort()

  it('found the example QR code fixtures', () => {
    expect(filenames.length).toBeGreaterThan(0)
  })

  it.each(filenames)('decodes %s instead of reporting it as an unrecognized label', (file) => {
    const decoded = decodeSamplePayload(texts[file])
    expect(decoded.ok).toBe(true)
  })

  it.each(filenames)('carries the batch number from %s through as batchNumber', (file) => {
    const decoded = decodeSamplePayload(texts[file])
    if (!decoded.ok) throw new Error('expected decode to succeed')
    expect(decoded.data.batchNumber).toBe(file.replace(/\.png$/i, ''))
  })

  it.each(filenames)('derives a stable, non-empty qrCode for %s across repeated scans', (file) => {
    const first = decodeSamplePayload(texts[file])
    const second = decodeSamplePayload(texts[file])
    if (!first.ok || !second.ok) throw new Error('expected decode to succeed')
    expect(first.data.qrCode).toBe(second.data.qrCode)
    expect(first.data.qrCode.length).toBeGreaterThan(0)
  })

  it('accepts the labels whose category matches a real temperature zone (4C)', () => {
    const validCategoryFiles = filenames.filter((file) => {
      const decoded = decodeSamplePayload(texts[file])
      return decoded.ok && decoded.data.category === '4C'
    })
    expect(validCategoryFiles).toEqual(['BATCH-2024-003.png', 'BATCH-2024-004.png'])

    for (const file of validCategoryFiles) {
      const decoded = decodeSamplePayload(texts[file])
      if (!decoded.ok) throw new Error('expected decode to succeed')
      const input: NewInventoryItemInput = { ...decoded.data, location: { track: 1, position: 1 } }
      const validation = validateInventoryItem(input)
      expect(validation.isValid).toBe(true)
    }
  })

  it('flags the labels whose category is a hazard class, not a temperature zone, with a category error', () => {
    const hazardCategoryFiles = filenames.filter((file) => {
      const decoded = decodeSamplePayload(texts[file])
      return decoded.ok && decoded.data.category !== '4C'
    })
    expect(hazardCategoryFiles.length).toBeGreaterThan(0)

    for (const file of hazardCategoryFiles) {
      const decoded = decodeSamplePayload(texts[file])
      if (!decoded.ok) throw new Error('expected decode to succeed')
      const input: NewInventoryItemInput = { ...decoded.data, location: { track: 1, position: 1 } }
      const validation = validateInventoryItem(input)
      expect(validation.isValid).toBe(false)
      expect(validation.errors.category).toBe('Category must be 4C or -20C')
    }
  })

  it('preserves the supplier shelf/cabinet location text in notes since it does not fit the freezer slot system', () => {
    const decoded = decodeSamplePayload(texts['BATCH-2024-005.png'])
    if (!decoded.ok) throw new Error('expected decode to succeed')
    expect(decoded.data.notes).toBe('Supplier label location: Cabinet F-01')
  })
})

describe('decodeSamplePayload - malformed legacy-shaped input', () => {
  it('reports a decode error for a label missing quantity', () => {
    const decoded = decodeSamplePayload('Name,Ethanol\nCompany,VWR\nCategory,4C')
    expect(decoded).toEqual({ ok: false, error: 'Sample label has an invalid quantity.' })
  })

  it('reports a decode error for a label missing name/company', () => {
    const decoded = decodeSamplePayload('Volume,1000\nQuantity,20\nCategory,4C')
    expect(decoded).toEqual({
      ok: false,
      error: 'This QR code is not a ThermalHaven sample label.'
    })
  })
})
