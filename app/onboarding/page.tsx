'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [householdName, setHouseholdName] = useState('')
  const [myName, setMyName] = useState('')
  const [myShare, setMyShare] = useState(60)
  const [otherMembers, setOtherMembers] = useState([{ name: '', share: 40 }])

  useEffect(() => {
    fetch('/api/auth/get-session')
      .then(r => r.json())
      .then(data => {
        if (data?.user?.name) setMyName(data.user.name.split(' ')[0])
      })
      .catch(() => {})
  }, [])

  const allMembers = [{ name: myName, share: myShare }, ...otherMembers]
  const totalShare = allMembers.reduce((s, m) => s + m.share, 0)
  const sharesOk = Math.abs(totalShare - 100) < 0.5

  function updateOther(i: number, field: 'name' | 'share', value: string | number) {
    setOtherMembers(prev => prev.map((m, idx) => idx === i ? { ...m, [field]: value } : m))
  }

  async function createHousehold() {
    if (!householdName || !sharesOk) return
    setLoading(true)
    try {
      const res = await fetch('/api/household/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: householdName, members: allMembers }),
      })
      if (res.ok) router.push('/presupuesto?setup=true')
      else { alert('Error creando el hogar'); setLoading(false) }
    } catch {
      alert('Error de conexion')
      setLoading(false)
    }
  }

  const suggestions = ['Casa familiar', 'Hogar 2026', 'Apartamento', 'Familia']

  return (
    <div style={{ minHeight: '100vh', background: 'var(--off)', display: 'flex', flexDirection: 'column' }}>

      {/* PROGRESS */}
      <div style={{ padding: '56px 24px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {[1, 2].map(s => (
              <div key={s} style={{ height: 6, borderRadius: 999, background: s <= step ? 'var(--title)' : 'var(--border)', width: s === step ? 24 : 6, transition: 'all .3s' }} />
            ))}
          </div>
          <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--muted)' }}>Paso {step} de 2</span>
        </div>

        {/* STEP 1 */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--green-dk)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 8 }}>
                Tu hogar
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-.02em', lineHeight: 1.15, marginBottom: 12 }}>
                Dale un nombre a tu hogar
              </div>
              <div style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6 }}>
                Puede ser el apellido de la familia o el nombre del lugar. Esto es lo que verán todos los miembros.
              </div>
            </div>

            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 8 }}>
                Nombre del hogar
              </div>
              <input
                type="text"
                placeholder="ej. Hogar Martínez"
                value={householdName}
                onChange={e => setHouseholdName(e.target.value)}
                style={{ width: '100%', height: 52, background: 'var(--white)', border: '1.5px solid ' + (householdName ? 'var(--title)' : 'var(--border)'), borderRadius: 'var(--r-sm)', padding: '0 16px', fontSize: 16, fontWeight: 500, color: 'var(--title)', outline: 'none' }}
              />
            </div>

            <div>
              <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--muted)', marginBottom: 10 }}>Sugerencias</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {suggestions.map(s => (
                  <button key={s} onClick={() => setHouseholdName(s)} style={{ padding: '7px 14px', background: householdName === s ? 'var(--title)' : 'var(--white)', color: householdName === s ? '#fff' : 'var(--body)', border: '1.5px solid ' + (householdName === s ? 'var(--title)' : 'var(--border)'), borderRadius: 'var(--r-full)', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--green-dk)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 8 }}>
                Miembros
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-.02em', lineHeight: 1.15, marginBottom: 12 }}>
                Quienes viven aqui
              </div>
              <div style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6 }}>
                Asigna un porcentaje a cada miembro. Estos reflejan cuanto le corresponde pagar a cada uno del total mensual — idealmente basado en sus ingresos.
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* TÚ */}
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 4 }}>
                Tu cuenta (admin)
              </div>
              <div style={{ background: 'var(--white)', border: '1.5px solid var(--title)', borderRadius: 'var(--r-sm)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: 'var(--title)', flexShrink: 0 }}>
                  {myName[0] ?? '?'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>{myName || 'Cargando...'}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>Admin del hogar</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input
                    type="number"
                    value={myShare}
                    min={0} max={100}
                    onChange={e => setMyShare(Number(e.target.value))}
                    style={{ width: 52, height: 40, background: 'var(--soft)', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 17, fontWeight: 600, textAlign: 'center', color: 'var(--title)', outline: 'none', fontFamily: 'var(--mono)' }}
                  />
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--muted)' }}>%</span>
                </div>
              </div>

              {/* OTROS */}
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: '.08em', textTransform: 'uppercase', marginTop: 8, marginBottom: 4 }}>
                Otros miembros
              </div>
              {otherMembers.map((m, i) => (
                <div key={i} style={{ background: 'var(--white)', border: '1.5px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: 'var(--muted)', flexShrink: 0 }}>
                    {m.name[0] ?? '?'}
                  </div>
                  <input
                    type="text"
                    placeholder={'Miembro ' + (i + 2)}
                    value={m.name}
                    onChange={e => updateOther(i, 'name', e.target.value)}
                    style={{ flex: 1, border: 'none', background: 'transparent', fontSize: 15, fontWeight: 500, color: 'var(--title)', outline: 'none' }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input
                      type="number"
                      value={m.share}
                      min={0} max={100}
                      onChange={e => updateOther(i, 'share', Number(e.target.value))}
                      style={{ width: 52, height: 40, background: 'var(--soft)', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 17, fontWeight: 600, textAlign: 'center', color: 'var(--title)', outline: 'none', fontFamily: 'var(--mono)' }}
                    />
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--muted)' }}>%</span>
                  </div>
                  {otherMembers.length > 1 && (
                    <button onClick={() => setOtherMembers(prev => prev.filter((_, idx) => idx !== i))} style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: 20, padding: 4, lineHeight: 1 }}>×</button>
                  )}
                </div>
              ))}

              <button
                onClick={() => setOtherMembers(prev => [...prev, { name: '', share: 0 }])}
                style={{ padding: '12px', border: '1.5px dashed var(--border)', borderRadius: 'var(--r-sm)', background: 'transparent', fontSize: 13, fontWeight: 600, color: 'var(--muted)', cursor: 'pointer' }}>
                + Agregar miembro
              </button>
            </div>

            {/* TOTAL */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: sharesOk ? 'rgba(201,242,106,.12)' : 'rgba(255,90,60,.06)', border: '1px solid ' + (sharesOk ? 'rgba(201,242,106,.4)' : 'rgba(255,90,60,.2)'), borderRadius: 'var(--r-sm)' }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Total</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 18, fontWeight: 500, color: sharesOk ? 'var(--green-dk)' : 'var(--red)' }}>
                {totalShare}% {sharesOk ? '✓' : '— faltan ' + (100 - totalShare) + '%'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div style={{ padding: '24px', marginTop: 'auto' }}>
        {step === 1 ? (
          <button
            onClick={() => setStep(2)}
            disabled={!householdName}
            style={{ width: '100%', height: 52, background: 'var(--title)', color: '#fff', border: 'none', borderRadius: 'var(--r-sm)', fontSize: 15, fontWeight: 700, cursor: 'pointer', opacity: !householdName ? .4 : 1 }}>
            Continuar →
          </button>
        ) : (
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => setStep(1)}
              style={{ flex: 1, height: 52, background: 'transparent', border: '1.5px solid var(--border)', borderRadius: 'var(--r-sm)', fontSize: 15, fontWeight: 600, cursor: 'pointer', color: 'var(--body)' }}>
              ← Atrás
            </button>
            <button
              onClick={createHousehold}
              disabled={!sharesOk || loading}
              style={{ flex: 2, height: 52, background: 'var(--title)', color: '#fff', border: 'none', borderRadius: 'var(--r-sm)', fontSize: 15, fontWeight: 700, cursor: 'pointer', opacity: !sharesOk || loading ? .4 : 1 }}>
              {loading ? 'Creando...' : 'Crear hogar'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}