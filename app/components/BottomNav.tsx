'use client'
import { usePathname } from 'next/navigation'

export default function BottomNav() {
  const pathname = usePathname()

  const hideOn = ['/login', '/onboarding', '/invite']
  if (hideOn.some(p => pathname.startsWith(p))) return null

  const tabs = [
    { href: '/dashboard', icon: '🏠', label: 'Inicio' },
    { href: '/gastos', icon: '💳', label: 'Gastos' },
    { href: '/gastos/nuevo', icon: '+', label: '', isCenter: true },
    { href: '/presupuesto', icon: '📊', label: 'Presupuesto' },
    { href: '/reportes', icon: '📈', label: 'Reportes' },
  ]

  return (
    <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 430, background: 'var(--white)', borderTop: '1px solid var(--border)', display: 'flex', paddingBottom: 24, zIndex: 100 }}>
      {tabs.map(tab => (
        <a key={tab.href} href={tab.href} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: 10, textDecoration: 'none', gap: 3 }}>
          {tab.isCenter ? (
            <div style={{ width: 52, height: 52, background: 'var(--title)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, color: '#fff', marginTop: -20, border: '4px solid var(--off)' }}>+</div>
          ) : (
            <>
              <span style={{ fontSize: 20 }}>{tab.icon}</span>
              <span style={{ fontSize: 10, fontWeight: 600, color: pathname === tab.href ? 'var(--title)' : 'var(--muted)' }}>{tab.label}</span>
              {pathname === tab.href && <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--title)' }} />}
            </>
          )}
        </a>
      ))}
    </div>
  )
}