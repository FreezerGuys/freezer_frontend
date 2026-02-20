import { Providers } from './providers'

export const metadata = {
  title: 'Freezer Inventory Management',
  description: 'Professional laboratory freezer inventory tracking system',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
