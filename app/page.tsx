export default function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--black)', display: 'flex', flexDirection: 'column' }}>

      {/* TOP */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 32px 32px', textAlign: 'center' }}>

        {/* Illustration */}
        <div style={{ width: 180, height: 180, background: 'rgba(201,242,106,.06)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 48, position: 'relative' }}>
          <div style={{ width: 120, height: 120, background: 'rgba(201,242,106,.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 52 }}>
            🏡
          </div>
          <div style={{ position: 'absolute', top: 20, right: 20, width: 36, height: 36, background: 'var(--green)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
            💰
          </div>
          <div style={{ position: 'absolute', bottom: 20, left: 20, width: 36, height: 36, background: 'rgba(255,255,255,.08)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
            📊
          </div>
        </div>

        {/* Step dots */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 32 }}>
          <div style={{ width: 20, height: 6, borderRadius: 999, background: '#fff' }} />
          <div style={{ width: 6, height: 6, borderRadius: 999, background: 'rgba(255,255,255,.2)' }} />
          <div style={{ width: 6, height: 6, borderRadius: 999, background: 'rgba(255,255,255,.2)' }} />
        </div>

        <div style={{ fontSize: 36, fontWeight: 800, color: '#fff', letterSpacing: '-.03em', lineHeight: 1.1, marginBottom: 16 }}>
          Finanzas<br />sin dramas
        </div>
        <div style={{ fontSize: 15, color: 'rgba(255,255,255,.45)', lineHeight: 1.6, maxWidth: 280 }}>
          Divide gastos, controla tu presupuesto y liquida deudas de forma justa.
        </div>
      </div>

      {/* BOTTOM */}
      <div style={{ padding: '0 24px 48px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <a href="/login?mode=register"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 52, background: 'var(--green)', color: 'var(--title)', borderRadius: 'var(--r-sm)', fontSize: 15, fontWeight: 700, textDecoration: 'none' }}>
          Crear mi hogar gratis
        </a>
        <a href="/login"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 52, background: 'rgba(255,255,255,.08)', color: 'rgba(255,255,255,.7)', borderRadius: 'var(--r-sm)', fontSize: 15, fontWeight: 600, textDecoration: 'none' }}>
          Ya tengo cuenta — Entrar
        </a>
      </div>
    </div>
  )
}