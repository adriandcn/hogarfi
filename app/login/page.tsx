'use client'
import { useState } from 'react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function loginWithGoogle() {
    setLoading(true)
    try {
      const res = await fetch('/api/auth/sign-in/social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: 'google', callbackURL: '/dashboard' }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch {
      setLoading(false)
    }
  }

  async function sendMagicLink() {
    if (!email) return
    setLoading(true)
    try {
      await fetch('/api/auth/sign-in/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, callbackURL: '/dashboard' }),
      })
      setSent(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--black)', display: 'flex', flexDirection: 'column' }}>

      {/* TOP — branding */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 32px 32px' }}>
        <div style={{ width: 80, height: 80, background: 'rgba(201,242,106,.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
          <div style={{ width: 48, height: 48, background: 'rgba(201,242,106,.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
            🏡
          </div>
        </div>
        <div style={{ fontSize: 32, fontWeight: 800, color: '#fff', letterSpacing: '-.03em', marginBottom: 8 }}>
          Hogar<span style={{ color: 'var(--green)' }}>Fi</span>
        </div>
        <div style={{ fontSize: 15, color: 'rgba(255,255,255,.45)', textAlign: 'center', lineHeight: 1.5 }}>
          Finanzas familiares sin dramas
        </div>
      </div>

      {/* BOTTOM — auth */}
      <div style={{ background: 'var(--off)', borderRadius: '28px 28px 0 0', padding: '32px 24px 48px' }}>

        {sent ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>📬</div>
            <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, letterSpacing: '-.01em' }}>
              Revisa tu email
            </div>
            <div style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6 }}>
              Enviamos un link de acceso a<br />
              <strong style={{ color: 'var(--title)' }}>{email}</strong>
            </div>
            <button
              onClick={() => { setSent(false); setLoading(false) }}
              style={{ marginTop: 24, background: 'transparent', border: 'none', fontSize: 14, color: 'var(--muted)', cursor: 'pointer', textDecoration: 'underline' }}>
              Usar otro email
            </button>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-.02em', marginBottom: 6 }}>
                Bienvenido
              </div>
              <div style={{ fontSize: 14, color: 'var(--muted)' }}>
                Entra con tu cuenta para continuar
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                onClick={loginWithGoogle}
                disabled={loading}
                style={{ height: 52, background: 'var(--title)', color: '#fff', border: 'none', borderRadius: 'var(--r-sm)', fontSize: 15, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, opacity: loading ? .6 : 1 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                {loading ? 'Entrando...' : 'Continuar con Google'}
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0' }}>
                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500 }}>o con email</span>
                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              </div>

              <input
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{ height: 52, background: 'var(--white)', border: '1.5px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '0 16px', fontSize: 15, color: 'var(--title)', outline: 'none', width: '100%' }}
              />

              <button
                onClick={sendMagicLink}
                disabled={!email || loading}
                style={{ height: 52, background: 'transparent', color: 'var(--title)', border: '1.5px solid var(--border)', borderRadius: 'var(--r-sm)', fontSize: 15, fontWeight: 600, cursor: 'pointer', opacity: !email || loading ? .5 : 1 }}>
                {loading ? 'Enviando...' : 'Enviar magic link'}
              </button>
            </div>

            <div style={{ marginTop: 24, fontSize: 12, color: 'var(--muted)', textAlign: 'center', lineHeight: 1.6 }}>
              Al continuar aceptas los Términos de uso<br />y la Política de privacidad
            </div>
          </>
        )}
      </div>
    </div>
  )
}