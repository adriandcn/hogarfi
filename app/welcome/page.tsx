import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function WelcomePage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/login')

  const member = await prisma.householdMember.findFirst({
    where: { userId: session.user.id },
    include: {
      household: {
        include: { members: { include: { user: true } } },
      },
    },
  })

  if (!member) redirect('/onboarding')

  const household = member.household
  const members = household.members

  const colors = [
    { bg: '#c9f26a', color: '#1a1814' },
    { bg: '#dbeafe', color: '#1e40af' },
    { bg: '#fef3c7', color: '#92400e' },
    { bg: '#ede9fe', color: '#5b21b6' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--black)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', textAlign: 'center' }}>

      <div style={{ width: 100, height: 100, background: 'rgba(201,242,106,.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 32, fontSize: 48 }}>
        🎉
      </div>

      <div style={{ fontSize: 30, fontWeight: 800, color: '#fff', letterSpacing: '-.02em', lineHeight: 1.15, marginBottom: 16 }}>
        {household.name}<br />está listo
      </div>

      <div style={{ fontSize: 15, color: 'rgba(255,255,255,.45)', lineHeight: 1.6, marginBottom: 48, maxWidth: 280 }}>
        Ahora puedes agregar tu primer gasto y ver cómo se distribuye entre todos.
      </div>

      <div style={{ display: 'flex', gap: 20, marginBottom: 56 }}>
        {members.map((m, i) => {
          const c = colors[i % colors.length]
          const name = (m.name ?? m.user?.name ?? '?').split(' ')[0]
          return (
            <div key={m.id} style={{ textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: c.color, margin: '0 auto 8px' }}>
                {name[0]}
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 2 }}>{name}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,.35)' }}>{m.defaultShare}%</div>
            </div>
          )
        })}
      </div>

      <div style={{ width: '100%', maxWidth: 340, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <a href="/presupuesto?setup=true" style={{ display: 'block', height: 52, background: 'var(--green)', color: 'var(--title)', borderRadius: 'var(--r-sm)', fontSize: 15, fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          Configurar presupuesto
        </a>
        <a href="/gastos/nuevo" style={{ display: 'block', height: 52, background: 'rgba(255,255,255,.08)', color: 'rgba(255,255,255,.7)', borderRadius: 'var(--r-sm)', fontSize: 15, fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          Agregar primer gasto
        </a>
      </div>
    </div>
  )
}