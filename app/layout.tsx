import type { Metadata } from 'next'
import './globals.css'
import BottomNav from './components/BottomNav'

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
      <body>
        <div style={{ maxWidth: 430, margin: '0 auto', minHeight: '100vh', position: 'relative', background: 'var(--off)' }}>
          {children}
          <BottomNav />
        </div>
      </body>
    </html>
  )
}