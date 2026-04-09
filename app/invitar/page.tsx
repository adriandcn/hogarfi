import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import CopyButton from './copy-button'

async function getInvitations(activeHouseholdId?: string) {
  const baseUrl = process.env.BETTER_AUTH_URL ?? 'http://localhost:3000'
  const url = activeHouseholdId
    ? `${baseUrl}/api/household/invite?householdId=${activeHouseholdId}`
    : `${baseUrl}/api/household/invite`
  const res = await fetch(url, {
    headers: { cookie: (await headers()).get('cookie') ?? '' },
    cache: 'no-store',
  })
  return res.json()
}

export default async function InvitarPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/login')

  const cookieStore = await cookies()
  const activeHouseholdId = cookieStore.get('active_household')?.value

  const data = await getInvitations(activeHouseholdId)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--off)', paddingBottom: 100 }}>

      <div style={{ background: 'var(--title)', padding: '52px 20px 20px' }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: '#fff', letterSpacing: '-.02em', marginBottom: 4 }}>
          Invitar miembros
        </div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,.4)' }}>
          {data.householdName}
        </div>
      </div>

      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        <div style={{ background: 'rgba(201,242,106,.08)', border: '1px solid rgba(201,242,106,.25)', borderRadius: 14, padding: '14px 16px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--green-dk)', marginBottom: 4 }}>
            Como funciona
          </div>
          <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>
            Comparte el link con cada miembro. Pueden agregar gastos sin registrarse, o registrarse para ver todo el hogar.
          </div>
        </div>

        {data.invitations?.length === 0 && (
          <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 16, padding: '40px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>✅</div>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Todos unidos</div>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>
              Todos los miembros ya tienen cuenta activa
            </div>
            <a href="/configuracion" style={{ display: 'inline-block', background: 'var(--title)', color: '#fff', borderRadius: 999, padding: '10px 20px', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
              Agregar miembro
            </a>
          </div>
        )}

        {data.invitations?.map((inv: any) => (
          <div key={inv.id} style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 16, padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: 'var(--muted)', flexShrink: 0 }}>
                {inv.memberName[0]}
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{inv.memberName}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>Invitacion pendiente</div>
              </div>
            </div>
            <div style={{ background: 'var(--soft)', borderRadius: 8, padding: '10px 12px', marginBottom: 10, fontSize: 11, color: 'var(--muted)', wordBreak: 'break-all', fontFamily: 'var(--mono)' }}>
              {inv.link}
            </div>
            <CopyButton link={inv.link} name={inv.memberName} />
          </div>
        ))}

        <a href="/configuracion" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 48, background: 'var(--white)', border: '1.5px solid var(--border)', borderRadius: 14, fontSize: 14, fontWeight: 600, color: 'var(--body)', textDecoration: 'none' }}>
          + Agregar miembro nuevo
        </a>

      </div>
    </div>
  )
}