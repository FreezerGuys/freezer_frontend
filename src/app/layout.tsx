export const metadata = {
  title: 'Freezer POC',
  description: 'The coolest guys aaround',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
