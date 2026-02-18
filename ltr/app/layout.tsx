import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'LEARN TO RIDE',
  description: 'Snowboard tricks library',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
   <html lang="it" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  )
}
