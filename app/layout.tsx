import type { Metadata } from 'next'
import { Toaster } from 'sonner'
import './globals.css'

export const metadata: Metadata = {
  title: 'Hello Athena — POS & Admin',
  description: 'Point of Sale and Inventory Management for Hello Athena',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ backgroundColor: '#0A0A0A', color: '#F5F5F5', margin: 0, fontFamily: 'sans-serif' }}>
        {children}
        <Toaster theme="dark" position="bottom-right" />
      </body>
    </html>
  )
}
