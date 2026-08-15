import { useEffect, useRef, useState } from 'react'
import QrScanner from 'qr-scanner'
import {
  Dialog,
  Box,
  Typography,
  Button,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Chip,
  CircularProgress,
  Grid
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import { FreezerMap } from '@/components/FreezerMap'
import { decodeSamplePayload, SamplePayloadV1 } from '@/lib/qr'
import { validateInventoryItem, formatValidationErrors } from '@/lib/validators'
import { addInventoryItem, isDuplicateInventory, isDuplicateQrCode } from '@/lib/firebaseQueries'
import { InventoryItem, NewInventoryItemInput } from '@/types/inventory'

const CAMERA_STORAGE_KEY = 'thermalhaven.importCameraId'

type Phase = 'scanning' | 'scanError' | 'reviewing' | 'success'

interface Props {
  open: boolean
  onClose: () => void
  userId: string
  inventory: InventoryItem[]
  onImported: () => void
}

export function ImportModeOverlay({ open, onClose, userId, inventory, onImported }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const scannerRef = useRef<QrScanner | null>(null)
  const onDecodeRef = useRef<(result: QrScanner.ScanResult) => void>(() => {})

  const [cameras, setCameras] = useState<QrScanner.Camera[]>([])
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)

  const [phase, setPhase] = useState<Phase>('scanning')
  const [decodeError, setDecodeError] = useState<string | null>(null)
  const [decodedPayload, setDecodedPayload] = useState<SamplePayloadV1 | null>(null)
  const [selectedLocation, setSelectedLocation] = useState<{ track: number; position: number } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const resetScanState = () => {
    setPhase('scanning')
    setDecodeError(null)
    setDecodedPayload(null)
    setSelectedLocation(null)
    setSubmitError(null)
  }

  // Reset state and discover cameras each time the overlay is opened
  useEffect(() => {
    if (!open) return
    resetScanState()
    setCameraError(null)

    let cancelled = false
    QrScanner.listCameras(true)
      .then((cams) => {
        if (cancelled) return
        setCameras(cams)
        if (cams.length === 0) {
          setCameraError('No camera was found. Connect a USB camera and reopen Import Mode.')
          return
        }
        const stored = localStorage.getItem(CAMERA_STORAGE_KEY)
        const initial = cams.find((c) => c.id === stored)?.id ?? cams[0].id
        setSelectedCameraId(initial)
      })
      .catch(() => {
        if (!cancelled) {
          setCameraError('Could not access the camera. Check camera permissions and reopen Import Mode.')
        }
      })

    return () => {
      cancelled = true
    }
  }, [open])

  // Keep the decode handler ref fresh without tearing down the scanner
  useEffect(() => {
    onDecodeRef.current = (result: QrScanner.ScanResult) => {
      scannerRef.current?.pause()

      const decoded = decodeSamplePayload(result.data)
      if (!decoded.ok) {
        setDecodeError(decoded.error)
        setPhase('scanError')
        return
      }

      const validation = validateInventoryItem(decoded.data as NewInventoryItemInput)
      if (!validation.isValid) {
        setDecodeError(formatValidationErrors(validation.errors))
        setPhase('scanError')
        return
      }

      setDecodedPayload(decoded.data)
      setSelectedLocation(null)
      setSubmitError(null)
      setPhase('reviewing')
    }
  })

  // Create/destroy the scanner when the overlay opens or the camera changes
  useEffect(() => {
    if (!open || !selectedCameraId || !videoRef.current) return

    const scanner = new QrScanner(
      videoRef.current,
      (result) => onDecodeRef.current(result),
      {
        onDecodeError: () => {
          /* fires continuously while no code is in frame - ignore */
        },
        preferredCamera: selectedCameraId,
        maxScansPerSecond: 5,
        highlightScanRegion: true,
        highlightCodeOutline: true
      }
    )
    scannerRef.current = scanner

    scanner.start().catch(() => {
      setCameraError('Unable to start the camera. Check camera permissions and reopen Import Mode.')
    })

    return () => {
      scanner.destroy()
      scannerRef.current = null
    }
  }, [open, selectedCameraId])

  const handleCameraChange = (deviceId: string) => {
    setSelectedCameraId(deviceId)
    localStorage.setItem(CAMERA_STORAGE_KEY, deviceId)
  }

  const handleScanAgain = () => {
    resetScanState()
    scannerRef.current?.start()
  }

  const handleConfirm = async () => {
    if (!decodedPayload || !selectedLocation || !userId) return

    setIsSubmitting(true)
    setSubmitError(null)
    try {
      const alreadyImported = await isDuplicateQrCode(decodedPayload.qrCode)
      if (alreadyImported) {
        setSubmitError('This label has already been imported.')
        return
      }

      const duplicateSample = await isDuplicateInventory(
        decodedPayload.name,
        decodedPayload.company,
        decodedPayload.batchNumber
      )
      if (duplicateSample) {
        setSubmitError(
          `A sample with this name and company${decodedPayload.batchNumber ? ' and batch' : ''} already exists. Check with an administrator.`
        )
        return
      }

      const input: NewInventoryItemInput = {
        ...decodedPayload,
        location: selectedLocation
      }
      await addInventoryItem(input, userId)

      onImported()
      setPhase('success')
      setTimeout(() => {
        resetScanState()
        scannerRef.current?.start()
      }, 1500)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to import sample.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog fullScreen open={open} onClose={onClose}>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', bgcolor: '#0f172a' }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 3,
            py: 2,
            bgcolor: '#111827'
          }}
        >
          <Typography variant="h5" sx={{ color: 'white', fontWeight: 700 }}>
            Import Mode
          </Typography>
          <Button
            variant="contained"
            color="error"
            size="large"
            startIcon={<CloseIcon />}
            onClick={onClose}
          >
            Exit Import Mode
          </Button>
        </Box>

        <Box sx={{ flex: 1, overflowY: 'auto', p: 3 }}>
          {cameras.length > 1 && (
            <FormControl size="small" sx={{ mb: 2, minWidth: 240, bgcolor: 'white', borderRadius: 1 }}>
              <InputLabel>Camera</InputLabel>
              <Select
                value={selectedCameraId ?? ''}
                label="Camera"
                onChange={(e) => handleCameraChange(e.target.value as string)}
              >
                {cameras.map((cam) => (
                  <MenuItem key={cam.id} value={cam.id}>
                    {cam.label || cam.id}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {cameraError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {cameraError}
            </Alert>
          )}

          {(phase === 'scanning' || phase === 'scanError') && !cameraError && (
            <Paper sx={{ p: 2, maxWidth: 640, mx: 'auto', borderRadius: 2 }}>
              <Typography variant="body1" sx={{ mb: 2, textAlign: 'center', fontWeight: 600 }}>
                Point the camera at a sample&apos;s QR label
              </Typography>
              <Box
                sx={{
                  position: 'relative',
                  width: '100%',
                  borderRadius: 2,
                  overflow: 'hidden',
                  bgcolor: 'black'
                }}
              >
                <video ref={videoRef} muted playsInline style={{ width: '100%', display: 'block' }} />
              </Box>

              {phase === 'scanError' && decodeError && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  {decodeError}
                </Alert>
              )}
              {phase === 'scanError' && (
                <Box sx={{ textAlign: 'center', mt: 2 }}>
                  <Button variant="contained" size="large" onClick={handleScanAgain}>
                    Scan Again
                  </Button>
                </Box>
              )}
            </Paper>
          )}

          {phase === 'reviewing' && decodedPayload && (
            <Paper sx={{ p: 3, maxWidth: 900, mx: 'auto', borderRadius: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                Confirm Sample
              </Typography>

              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6} sm={4}>
                  <Typography variant="caption" color="text.secondary">Name</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>{decodedPayload.name}</Typography>
                </Grid>
                <Grid item xs={6} sm={4}>
                  <Typography variant="caption" color="text.secondary">Company</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>{decodedPayload.company}</Typography>
                </Grid>
                <Grid item xs={6} sm={4}>
                  <Typography variant="caption" color="text.secondary">Volume</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>{decodedPayload.volume}</Typography>
                </Grid>
                <Grid item xs={6} sm={4}>
                  <Typography variant="caption" color="text.secondary">Quantity</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>{decodedPayload.quantity}</Typography>
                </Grid>
                <Grid item xs={6} sm={4}>
                  <Typography variant="caption" color="text.secondary">Category</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>{decodedPayload.category}</Typography>
                </Grid>
                <Grid item xs={6} sm={4}>
                  <Typography variant="caption" color="text.secondary">Batch Number</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>{decodedPayload.batchNumber || '-'}</Typography>
                </Grid>
              </Grid>

              <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
                Tap a freezer slot to place this sample
              </Typography>
              <Box sx={{ mb: 2 }}>
                {selectedLocation ? (
                  <Chip
                    color="success"
                    label={`Selected: T${selectedLocation.track}-P${selectedLocation.position}`}
                  />
                ) : (
                  <Chip label="No location selected yet" />
                )}
              </Box>
              <FreezerMap
                items={inventory}
                onLocationClick={(track, position) => setSelectedLocation({ track, position })}
              />

              {submitError && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {submitError}
                </Alert>
              )}

              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 3 }}>
                <Button variant="outlined" size="large" onClick={handleScanAgain} disabled={isSubmitting}>
                  Cancel / Scan Again
                </Button>
                <Button
                  variant="contained"
                  color="success"
                  size="large"
                  disabled={!selectedLocation || isSubmitting}
                  onClick={handleConfirm}
                >
                  {isSubmitting ? <CircularProgress size={24} /> : 'Confirm Import'}
                </Button>
              </Box>
            </Paper>
          )}

          {phase === 'success' && (
            <Paper sx={{ p: 4, maxWidth: 480, mx: 'auto', borderRadius: 2, textAlign: 'center' }}>
              <CheckCircleIcon color="success" sx={{ fontSize: 64, mb: 1 }} />
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Sample Imported
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Ready to scan the next label...
              </Typography>
            </Paper>
          )}
        </Box>
      </Box>
    </Dialog>
  )
}
