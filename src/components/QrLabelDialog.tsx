import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography } from '@mui/material'
import PrintIcon from '@mui/icons-material/Print'
import DownloadIcon from '@mui/icons-material/Download'

interface Props {
  open: boolean
  onClose: () => void
  dataUrl: string
  itemName: string
  company: string
}

/**
 * Shows the QR code generated for a newly created sample so an
 * administrator can print or save it as a physical label. This dialog is
 * purely presentational - the sample is not written to Firestore until a
 * teacher scans this label in Import Mode.
 */
export function QrLabelDialog({ open, onClose, dataUrl, itemName, company }: Props) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Sample Label Ready</DialogTitle>
      <DialogContent sx={{ textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Print this label and attach it to the physical sample. It has not
          been added to inventory yet - scan it in Import Mode to complete
          the process.
        </Typography>

        <Box
          className="print-label"
          sx={{
            display: 'inline-flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 1,
            p: 2,
            border: '1px solid #e5e7eb',
            borderRadius: 2
          }}
        >
          {dataUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={dataUrl} alt={`QR code for ${itemName}`} width={240} height={240} />
          )}
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            {itemName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {company}
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button
          startIcon={<DownloadIcon />}
          component="a"
          href={dataUrl}
          download={`${itemName || 'sample'}-qr.png`}
        >
          Save PNG
        </Button>
        <Button startIcon={<PrintIcon />} onClick={() => window.print()}>
          Print Label
        </Button>
        <Button variant="contained" onClick={onClose}>
          Done
        </Button>
      </DialogActions>
    </Dialog>
  )
}
