import QRCode from 'qrcode'

/**
 * QR payload for a sample created by an administrator but not yet imported
 * into Firestore. Location is intentionally excluded - it's chosen by the
 * teacher at import/scan time, since the administrator printing the label
 * in advance can't know which freezer slot will be free later.
 */
export interface SamplePayloadV1 {
  name: string
  company: string
  volume: string
  quantity: number
  concentration?: string
  purchaseDate: string
  expirationDate: string
  notes: string
  batchNumber?: string
  serialNumber?: string
  casNumber?: string
  category: '4C' | '-20C'
  barcode?: string
  qrCode: string
}

export const QR_SCHEMA_ID = 'thermalhaven.sample'
export const QR_SCHEMA_VERSION = 1

export interface QrEnvelope {
  schema: typeof QR_SCHEMA_ID
  v: number
  data: SamplePayloadV1
}

export type DecodeResult =
  | { ok: true; data: SamplePayloadV1 }
  | { ok: false; error: string }

/**
 * Generates a unique QR code token, used both as the QR dedupe key and as
 * the `qrCode` field on the resulting InventoryItem.
 */
export function generateQrCodeId(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).slice(2, 6)
  return `QR-${timestamp}-${random}`.toUpperCase()
}

/**
 * Serializes a sample payload into the compact JSON string embedded in the
 * printed QR label.
 */
export function encodeSamplePayload(data: SamplePayloadV1): string {
  const envelope: QrEnvelope = {
    schema: QR_SCHEMA_ID,
    v: QR_SCHEMA_VERSION,
    data
  }
  return JSON.stringify(envelope)
}

/**
 * Parses a scanned QR code's raw text back into a sample payload. Returns a
 * result object rather than throwing so a foreign/garbage QR code scanned by
 * mistake fails gracefully.
 *
 * Supports two label formats:
 *  - The JSON envelope this app generates itself (see `encodeSamplePayload`).
 *  - The plain-text "Key,Value" per-line format used on supplier-printed
 *    labels (see public/Example_QR_Codes) that were never created by this
 *    app and so can't carry the JSON envelope.
 */
export function decodeSamplePayload(raw: string): DecodeResult {
  const trimmed = raw.trim()

  let parsed: unknown
  try {
    parsed = JSON.parse(trimmed)
  } catch {
    parsed = undefined
  }

  if (parsed !== undefined) {
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      (parsed as Partial<QrEnvelope>).schema !== QR_SCHEMA_ID
    ) {
      return { ok: false, error: 'This QR code is not a ThermalHaven sample label.' }
    }

    const envelope = parsed as QrEnvelope

    if (envelope.v !== QR_SCHEMA_VERSION) {
      return { ok: false, error: `Unsupported sample label version (${envelope.v}).` }
    }

    if (!envelope.data || typeof envelope.data !== 'object') {
      return { ok: false, error: 'Sample label is missing data.' }
    }

    return { ok: true, data: envelope.data }
  }

  const legacyFields = parseLegacyLabelText(trimmed)
  if (legacyFields) {
    return decodeLegacyLabel(legacyFields, trimmed)
  }

  return { ok: false, error: 'This QR code is not a ThermalHaven sample label.' }
}

/**
 * Parses the plain-text label format into a lowercase-keyed field map, or
 * returns null if the text doesn't look like that format at all (e.g. a
 * garbage/unrelated QR code).
 */
function parseLegacyLabelText(raw: string): Record<string, string> | null {
  const lines = raw.split('\n').map((line) => line.trim()).filter(Boolean)
  if (lines.length === 0) return null

  const fields: Record<string, string> = {}
  for (const line of lines) {
    const commaIndex = line.indexOf(',')
    if (commaIndex === -1) return null
    const key = line.slice(0, commaIndex).trim().toLowerCase()
    const value = line.slice(commaIndex + 1).trim()
    if (!key) return null
    fields[key] = value
  }
  return fields
}

function decodeLegacyLabel(fields: Record<string, string>, rawText: string): DecodeResult {
  const name = fields['name']
  const company = fields['company']
  if (!name || !company) {
    return { ok: false, error: 'This QR code is not a ThermalHaven sample label.' }
  }

  const quantityRaw = fields['quantity']
  const quantity = Number(quantityRaw)
  if (!quantityRaw || Number.isNaN(quantity)) {
    return { ok: false, error: 'Sample label has an invalid quantity.' }
  }

  const legacyLocation = fields['location']

  const data: SamplePayloadV1 = {
    name,
    company,
    volume: fields['volume'] ?? '',
    quantity,
    purchaseDate: '',
    expirationDate: '',
    notes: legacyLocation ? `Supplier label location: ${legacyLocation}` : '',
    batchNumber: fields['batch number'],
    category: (fields['category'] ?? '') as SamplePayloadV1['category'],
    qrCode: `QR-LEGACY-${hashLabelText(rawText)}`
  }

  return { ok: true, data }
}

/**
 * Deterministic hash used to derive a stable dedupe key (`qrCode`) for
 * legacy labels, which don't carry one of their own. Hashing the raw text
 * (rather than e.g. generating a random id) ensures re-scanning the same
 * physical label always produces the same qrCode, so duplicate-import
 * detection works.
 */
function hashLabelText(text: string): string {
  let hash = 0
  for (let i = 0; i < text.length; i++) {
    hash = (Math.imul(31, hash) + text.charCodeAt(i)) | 0
  }
  return (hash >>> 0).toString(36).toUpperCase()
}

/**
 * Renders a payload's encoded JSON string as a scannable QR code image
 * (data URL suitable for an <img src> or download link).
 */
export async function generateQrDataUrl(payloadJson: string): Promise<string> {
  return QRCode.toDataURL(payloadJson, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 320
  })
}
