import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function WelcomePage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/login')

  const cookieStore = await cookies()
  const activeHouseholdId = cookieStore.get('active_household')?.value

  const member = await prisma.householdMember.findFirst({
    where: {
      userId: session.user.id,
      ...(activeHouseholdId ? { householdId: activeHouseholdId } : {}),
    },
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
    { bg: '#fce7f3', color: '#9d174d' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--black)', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>

      {/* Fondo decorativo */}
      <div style={{ position: 'absolute', top: -120, left: '50%', transform: 'translateX(-50%)', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(201,242,106,.07) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* CONTENIDO */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '64px 28px 32px', position: 'relative' }}>

        {/* Badge */}
        <div style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(201,242,106,.1)', border: '1px solid rgba(201,242,106,.2)', borderRadius: 999, padding: '5px 12px', marginBottom: 40 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)' }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--green)', letterSpacing: '.06em', textTransform: 'uppercase' }}>Hogar creado</span>
        </div>

        {/* Titulo principal */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 38, fontWeight: 900, color: '#fff', letterSpacing: '-.03em', lineHeight: 1.1, marginBottom: 4 }}>
            {household.name}
          </div>
          <div style={{ fontSize: 38, fontWeight: 900, letterSpacing: '-.03em', lineHeight: 1.1 }}>
            <span style={{ color: 'var(--green)' }}>ya tiene su hogar</span>
          </div>
        </div>

        {/* Mensaje inspirador */}
        <div style={{ fontSize: 16, color: 'rgba(255,255,255,.5)', lineHeight: 1.7, marginBottom: 40, maxWidth: 340 }}>
          Juntos trabajaremos para alcanzar sus metas y mantener las finanzas del hogar saludables. Cada gasto registrado es un paso hacia una vida mas organizada.
        </div>

        {/* Miembros */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.25)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 16 }}>
            Quienes forman parte
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {members.map((m, i) => {
              const c = colors[i % colors.length]
              const name = (m.name ?? m.user?.name ?? '?').split(' ')[0]
              return (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 999, padding: '6px 14px 6px 8px' }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: c.color, flexShrink: 0 }}>
                    {name[0]}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{name}</span>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,.3)', fontWeight: 500 }}>{m.defaultShare}%</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Pilares */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { icon: '📊', title: 'Control de gastos', desc: 'Registra y divide gastos al instante' },
            { icon: '🎯', title: 'Metas compartidas', desc: 'Ahorra juntos para lo que importa' },
            { icon: '⚖️', title: 'Cuentas claras', desc: 'Quien debe que, siempre transparente' },
          ].map(p => (
            <div key={p.icon} style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 14, padding: '14px 16px' }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(201,242,106,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                {p.icon}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 2 }}>{p.title}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,.35)' }}>{p.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FOOTER */}
      <div style={{ padding: '0 28px 52px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <a href="/dashboard"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 54, background: 'var(--green)', color: 'var(--title)', borderRadius: 'var(--r-sm)', fontSize: 15, fontWeight: 800, textDecoration: 'none', letterSpacing: '-.01em' }}>
          Empezar ahora →
        </a>
        <a href="/gastos/nuevo"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 48, background: 'rgba(255,255,255,.06)', color: 'rgba(255,255,255,.6)', borderRadius: 'var(--r-sm)', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
          Agregar primer gasto
        </a>
      </div>
    </div>
  )
}
