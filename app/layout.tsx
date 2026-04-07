import type { Metadata } from 'next'
import { Syne, Instrument_Sans } from 'next/font/google'
import './globals.css'
import BottomNav from './components/BottomNav'

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-syne',
  weight: ['400', '500', '600', '700', '800'],
})

const instrumentSans = Instrument_Sans({
  subsets: ['latin'],
  variable: '--font-instrument',
  weight: ['400', '500', '600'],
})

export const metadata: Metadata = {
  title: 'HogarFi — Finanzas en familia',
  description: 'Divide gastos y controla el presupuesto familiar',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={`${syne.variable} ${instrumentSans.variable} antialiased`}>
        <div style={{ maxWidth: 430, margin: '0 auto', minHeight: '100vh', position: 'relative', background: 'var(--bg)', boxShadow: '0 0 40px rgba(0,0,0,.08)' }}>
          {children}
          <BottomNav />
        </div>
      </body>
    </html>
  )
}