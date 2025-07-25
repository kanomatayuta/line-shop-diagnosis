import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '🚀 LINE Flow Designer Pro',
  description: 'Next.js Edition - Professional LINE Bot Flow Management',
  viewport: 'width=device-width, initial-scale=1',
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🚀</text></svg>",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}