 
'use client'
import { useState } from 'react'
import { authClient } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function loginWithGoogle() {
    setLoading(true)
    await authClient.signIn.social({
      provider: 'google',
      callbackURL: '/dashboard',
    })
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', maxWidth: 430, margin: '0 auto' }}>
      
      {/* Logo */}
      <div style={{ marginBottom: 48, textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-syne)', fontSize: 36, fontWeight: 800, letterSpacing: '-.03em', marginBottom: 8 }}>
          Hogar<span style={{ color: 'var(--lime-dk)' }}>Fi</span>
        </div>
        <div style={{ fontSize: 14, color: 'var(--ink3)' }}>
          Finanzas familiares sin dramas
        </div>
      </div>

      {/* Card */}
      <div style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontFamily: 'var(--font-syne)', fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
          Entrar a tu hogar
        </div>

        {/* Google */}
        <button
          onClick={loginWithGoogle}
          disabled={loading}
          style={{ width: '100%', background: 'var(--ink)', color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-syne)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, opacity: loading ? .6 : 1 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          {loading ? 'Entrando...' : 'Continuar con Google'}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }}/>
          <span style={{ fontSize: 12, color: 'var(--ink3)' }}>o</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }}/>
        </div>

        {/* Magic link */}
        <EmailLogin />

      </div>

      <div style={{ marginTop: 24, fontSize: 12, color: 'var(--ink3)', textAlign: 'center' }}>
        Al entrar aceptas nuestros términos de servicio
      </div>
    </div>
  )
}

function EmailLogin() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function sendMagicLink() {
    if (!email) return
    setLoading(true)
    await authClient.signIn.magicLink({
      email,
      callbackURL: '/dashboard',
    })
    setSent(true)
    setLoading(false)
  }

  if (sent) return (
    <div style={{ textAlign: 'center', padding: '16px', background: 'rgba(184,240,74,.1)', borderRadius: 12, border: '1px solid rgba(184,240,74,.3)' }}>
      <div style={{ fontSize: 24, marginBottom: 8 }}>📬</div>
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Revisa tu email</div>
      <div style={{ fontSize: 12, color: 'var(--ink3)' }}>Te enviamos un link para entrar a {email}</div>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <input
        type="email"
        placeholder="tu@email.com"
        value={email}
        onChange={e => setEmail(e.target.value)}
        style={{ width: '100%', background: 'var(--surface2)', border: '1.5px solid var(--border)', borderRadius: 12, padding: '13px 16px', fontSize: 15, color: 'var(--ink)', outline: 'none', fontFamily: 'var(--font-instrument)' }}
      />
      <button
        onClick={sendMagicLink}
        disabled={loading || !email}
        style={{ width: '100%', background: 'transparent', color: 'var(--ink)', border: '1.5px solid var(--border)', borderRadius: 12, padding: '13px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-syne)', opacity: loading || !email ? .5 : 1 }}>
        {loading ? 'Enviando...' : 'Entrar con email'}
      </button>
    </div>
  )
}