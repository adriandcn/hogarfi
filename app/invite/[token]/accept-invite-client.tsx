'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AcceptInviteClient({
  token,
  householdName,
  memberName,
  userName,
}: {
  token: string
  householdName: string
  memberName: string
  userName: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleAccept() {
    setLoading(true)
    try {
      const res = await fetch('/api/invite/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      if (res.ok) {
        router.push('/dashboard')
      } else {
        alert('Error al unirse al hogar')
        setLoading(false)
      }
    } catch {
      alert('Error de conexion')
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--black)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', textAlign: 'center' }}>

      <div style={{ width: 80, height: 80, background: 'rgba(201,242,106,.12)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, marginBottom: 24 }}>
        🏡
      </div>

      <div style={{ fontSize: 13, color: 'rgba(255,255,255,.4)', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 10 }}>
        Invitacion al hogar
      </div>

      <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', letterSpacing: '-.02em', marginBottom: 8 }}>
        {householdName}
      </div>

      <div style={{ fontSize: 15, color: 'rgba(255,255,255,.45)', marginBottom: 8 }}>
        {memberName !== userName ? (
          <span>Te invitaron como <span style={{ color: '#fff', fontWeight: 600 }}>{memberName}</span></span>
        ) : (
          <span>Te invitaron a unirte</span>
        )}
      </div>

      <div style={{ fontSize: 13, color: 'rgba(255,255,255,.3)', marginBottom: 48, lineHeight: 1.6 }}>
        Entrando como <span style={{ color: 'rgba(255,255,255,.6)' }}>{userName}</span>
      </div>

      <div style={{ width: '100%', maxWidth: 320, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button
          onClick={handleAccept}
          disabled={loading}
          style={{ height: 52, background: 'var(--green)', color: 'var(--title)', border: 'none', borderRadius: 'var(--r-sm)', fontSize: 15, fontWeight: 700, cursor: 'pointer', opacity: loading ? .6 : 1 }}>
          {loading ? 'Uniendome...' : 'Unirme a ' + householdName}
        </button>
        <button
          onClick={() => router.push('/dashboard')}
          style={{ height: 48, background: 'rgba(255,255,255,.06)', color: 'rgba(255,255,255,.5)', border: 'none', borderRadius: 'var(--r-sm)', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
          Ir a mi dashboard
        </button>
      </div>
    </div>
  )
}