import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

async function getInvitations() {
  const res = await fetch(`${process.env.BETTER_AUTH_URL}/api/household/invite`, {
    headers: { cookie: (await headers()).get('cookie') ?? '' },
    cache: 'no-store',
  })
  return res.json()
}

export default async function InvitarPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/login')

  const data = await getInvitations()

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', maxWidth: 430, margin: '0 auto' }}>

      <div style={{ background: 'var(--ink)', padding: '24px 20px 20px' }}>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,.45)', letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 6 }}>
          {data.householdName}
        </div>
        <div style={{ fontFamily: 'var(--font-syne)', fontSize: 24, fontWeight: 800, color: '#fff' }}>
          Invitar miembros
        </div>
      </div>

      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 100 }}>

        <div style={{ fontSize: 13, color: 'var(--ink3)', marginBottom: 4 }}>
          Comparte estos links con cada miembro para que puedan unirse al hogar con su cuenta de Google.
        </div>

        {data.invitations?.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
            <div style={{ fontFamily: 'var(--font-syne)', fontSize: 16, fontWeight: 700 }}>
              Todos los miembros ya están unidos
            </div>
          </div>
        )}

        {data.invitations?.map((inv: any) => (
          <div key={inv.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: 'var(--ink3)' }}>
                {inv.memberName[0]}
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{inv.memberName}</div>
                <div style={{ fontSize: 11, color: 'var(--ink3)' }}>Invitación pendiente</div>
              </div>
            </div>

            <div style={{ background: 'var(--surface2)', borderRadius: 8, padding: '10px 12px', marginBottom: 10, fontSize: 12, color: 'var(--ink3)', wordBreak: 'break-all', fontFamily: 'monospace' }}>
              {inv.link}
            </div>

            <CopyButton link={inv.link} name={inv.memberName} />
          </div>
        ))}
      </div>
    </div>
  )
}

function CopyButton({ link, name }: { link: string; name: string }) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      
        href={`https://wa.me/?text=Hola ${name}! Te invito a unirte a nuestro hogar en HogarFi: ${encodeURIComponent(link)}`}
        target="_blank"
        style={{ flex: 1, background: '#25D366', color: '#fff', border: 'none', borderRadius: 10, padding: '11px', fontSize: 13, fontWeight: 600, cursor: 'pointer', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        📱 WhatsApp
      </a>
    </div>
  )
} 
