'use client'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

const tabs = [
  { href: '/dashboard', icon: '🏠', label: 'Inicio' },
  { href: '/gastos', icon: '💳', label: 'Gastos' },
  { href: '/gastos/nuevo', icon: '➕', label: 'Agregar' },
  { href: '/liquidar', icon: '⚖️', label: 'Liquidar' },
  { href: '/invitar', icon: '👥', label: 'Invitar' },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'var(--surface)', borderTop: '1px solid var(--border)', display: 'flex', zIndex: 100, maxWidth: 430, margin: '0 auto', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {tabs.map(tab => {
        const isActive = pathname === tab.href
        const isAdd = tab.href === '/gastos/nuevo'
        return (
          <Link
            key={tab.href}
            href={tab.href}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '10px 4px 12px', textDecoration: 'none' }}>
            {isAdd ? (
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginTop: -20, boxShadow: '0 4px 16px rgba(26,24,20,.2)', border: '3px solid var(--bg)' }}>
                ➕
              </div>
            ) : (
              <>
                <div style={{ fontSize: 20, transition: 'transform .15s', transform: isActive ? 'scale(1.15)' : 'scale(1)' }}>
                  {tab.icon}
                </div>
                <div style={{ fontSize: 10, fontWeight: 600, color: isActive ? 'var(--ink)' : 'var(--ink3)', letterSpacing: '.02em' }}>
                  {tab.label}
                </div>
                <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--ink)', opacity: isActive ? 1 : 0, transition: 'opacity .2s' }}/>
              </>
            )}
          </Link>
        )
      })}
    </nav>
  )
} 
