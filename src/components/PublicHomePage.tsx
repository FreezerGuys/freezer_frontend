import { Box, Container, Typography, Button, Grid, Paper, Stack } from '@mui/material'
import AcUnitIcon from '@mui/icons-material/AcUnit'
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner'
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'
import { ContactForm } from './ContactForm'

interface Feature {
  icon: React.ReactNode
  title: string
  description: string
}

const FEATURES: Feature[] = [
  {
    icon: <AcUnitIcon fontSize="large" />,
    title: 'Dual Temperature Zones',
    description:
      'Track samples across both the 4°C refrigerator and -20°C freezer with a live 3x2 slot map, so everyone can see exactly where a sample lives.'
  },
  {
    icon: <QrCodeScannerIcon fontSize="large" />,
    title: 'QR Label Import',
    description:
      'Print a QR label the moment a sample arrives, then scan it into inventory later - no re-typing names, batch numbers, or CAS numbers by hand.'
  },
  {
    icon: <ShoppingCartIcon fontSize="large" />,
    title: 'Checkout Tracking',
    description:
      'Borrow and return samples with a full history of who took what, when, and when it is expected back.'
  },
  {
    icon: <AdminPanelSettingsIcon fontSize="large" />,
    title: 'Role-Based Access',
    description:
      'Admins manage inventory and accounts, students check items in and out - with an audit trail behind every change.'
  }
]

interface Props {
  onSignIn: () => void
}

/**
 * Public marketing homepage shown to signed-out visitors at "/". Signed-in
 * users never see this - see app/page.tsx, which renders the dashboard
 * instead once auth resolves.
 */
export function PublicHomePage({ onSignIn }: Props) {
  return (
    <Box>
      {/* Hero */}
      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
          color: 'white',
          pt: { xs: 9, md: 13 },
          pb: { xs: 13, md: 17 },
          px: 2,
          textAlign: 'center'
        }}
      >
        {/* Decorative glow blobs - purely cosmetic, sit behind the content */}
        <Box
          aria-hidden="true"
          sx={{
            position: 'absolute',
            top: -90,
            right: -90,
            width: 320,
            height: 320,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(16,185,129,0.35) 0%, rgba(16,185,129,0) 70%)',
            pointerEvents: 'none'
          }}
        />
        <Box
          aria-hidden="true"
          sx={{
            position: 'absolute',
            bottom: -120,
            left: -80,
            width: 360,
            height: 360,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 70%)',
            pointerEvents: 'none'
          }}
        />

        <Container
          maxWidth="md"
          sx={{
            position: 'relative',
            zIndex: 1,
            animation: 'homeHeroFadeIn 0.7s ease-out both',
            '@keyframes homeHeroFadeIn': {
              from: { opacity: 0, transform: 'translateY(16px)' },
              to: { opacity: 1, transform: 'translateY(0)' }
            },
            '@media (prefers-reduced-motion: reduce)': { animation: 'none' }
          }}
        >
          <Box
            component="span"
            sx={{
              display: 'inline-block',
              mb: 3,
              px: 2,
              py: 0.75,
              borderRadius: 999,
              bgcolor: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.3)',
              fontSize: '0.8rem',
              fontWeight: 600,
              letterSpacing: '0.03em'
            }}
          >
            ❄️ Built for shared lab freezers &amp; fridges
          </Box>
          <Typography
            variant="h2"
            sx={{ fontWeight: 800, mb: 2, fontSize: { xs: '2.25rem', md: '3rem' } }}
          >
            ThermalHaven
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 500, mb: 5, opacity: 0.92 }}>
            Laboratory freezer &amp; refrigerator inventory, without the spreadsheet.
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={onSignIn}
            sx={{
              // The theme's containedPrimary override sets `background` (a
              // shorthand covering background-image) to a blue gradient, so
              // overriding just `bgcolor`/backgroundColor here isn't enough
              // - the gradient still paints on top of it. Override the same
              // `background` shorthand instead, so it fully replaces the
              // theme's gradient rather than layering under it.
              background: 'white',
              color: 'primary.main',
              px: 5,
              py: 1.5,
              fontSize: '1.05rem',
              '&:hover': { background: '#f1f5f9' }
            }}
          >
            Sign In
          </Button>
        </Container>

        {/* Wave divider into the features section below */}
        <Box aria-hidden="true" sx={{ position: 'absolute', bottom: -1, left: 0, width: '100%', lineHeight: 0 }}>
          <svg viewBox="0 0 1440 100" preserveAspectRatio="none" style={{ display: 'block', width: '100%', height: '70px' }}>
            <path
              fill="#f8fafc"
              d="M0,64L60,58.7C120,53,240,43,360,48C480,53,600,75,720,80C840,85,960,75,1080,64C1200,53,1320,43,1380,37.3L1440,32L1440,100L0,100Z"
            />
          </svg>
        </Box>
      </Box>

      {/* Features */}
      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 10 } }}>
        <Typography variant="h3" sx={{ textAlign: 'center', mb: 1 }}>
          Everything your lab needs to know where samples are
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', mb: 6 }}>
          Built for teams sharing a small number of shared freezers and fridges.
        </Typography>

        <Grid container spacing={3}>
          {FEATURES.map((feature) => (
            <Grid item xs={12} sm={6} md={3} key={feature.title}>
              <Paper
                sx={{
                  p: 3,
                  height: '100%',
                  textAlign: 'center',
                  transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 24px rgba(15,23,42,0.12)'
                  }
                }}
              >
                <Box
                  sx={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 2,
                    bgcolor: 'rgba(37,99,235,0.1)',
                    color: 'primary.main'
                  }}
                >
                  {feature.icon}
                </Box>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  {feature.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {feature.description}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Contact */}
      <Box sx={{ bgcolor: 'background.paper', borderTop: '1px solid', borderColor: 'divider', py: { xs: 6, md: 10 } }}>
        <Container maxWidth="sm">
          <Stack spacing={1} sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant="h3">Get in Touch</Typography>
            <Typography variant="body1" color="text.secondary">
              Questions about setting up ThermalHaven for your lab? Send us a message.
            </Typography>
          </Stack>
          <Paper sx={{ p: { xs: 3, md: 4 } }}>
            <ContactForm />
          </Paper>
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{ bgcolor: '#0f172a', color: 'rgba(255,255,255,0.7)', py: 3, textAlign: 'center' }}>
        <Typography variant="body2">© 2026 ThermalHaven. All rights reserved.</Typography>
      </Box>
    </Box>
  )
}
