import type { AppProps } from 'next/app'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import theme from '@/lib/theme'
import '@/app/globals.css'

/**
 * Next.js Pages Router custom App - wraps every page under src/pages/
 * (login, dashboard, signup) with the same theme, CSS baseline, and global
 * reset that the App Router side (src/app/) gets via providers.tsx.
 *
 * Without this, pages/ routes had no ThemeProvider at all (silently
 * falling back to MUI's stock default theme instead of the app's actual
 * palette/typography/component overrides) and no CSS reset, so the
 * browser's default 8px `body` margin was visible as a white border
 * around every one of these pages.
 */
export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Component {...pageProps} />
    </ThemeProvider>
  )
}
