'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [householdName, setHouseholdName] = useState('')
  const [members, setMembers] = useState([
    { name: '', share: 60 },
    { name: '', share: 40 },
  ])

  const totalShare = members.reduce((s, m) => s + m.share, 0)
  const sharesOk = Math.abs(totalShare - 100) < 0.5

  function updateMember(i: number, field: 'name' | 'share', value: string | number) {
    setMembers(prev => prev.map((m, idx) => idx === i ? { ...m, [field]: value } : m))
  }

  function addMember() {
    setMembers(prev => [...prev, { name: '', share: 0 }])
  }

  function removeMember(i: number) {
    if (members.length <= 2) return
    setMembers(prev => prev.filter((_, idx) => idx !== i))
  }

  async function createHousehold() {
    if (!householdName || !sharesOk) return
    setLoading(true)

    const res = await fetch('/api/household/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: householdName, members }),
    })

    if (res.ok) {
      router.push('/dashboard')
    } else {
      alert('Error creando el hogar. Intenta de nuevo.')
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', maxWidth: 430, margin: '0 auto', padding: '40px 20px' }}>

      {/* Logo */}
      <div style={{ fontFamily: 'var(--font-syne)', fontSize: 24, fontWeight: 800, marginBottom: 32 }}>
        Hogar<span style={{ color: 'var(--lime-dk)' }}>Fi</span>
      </div>

      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-syne)', fontSize: 26, fontWeight: 800, marginBottom: 8 }}>
              Crea tu hogar 🏠
            </div>
            <div style={{ fontSize: 14, color: 'var(--ink3)' }}>
              Ponle un nombre a tu hogar familiar
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink3)', letterSpacing: '.08em', textTransform: 'uppercase' }}>
              Nombre del hogar
            </label>
            <input
              type="text"
              placeholder="ej. Hogar Martínez, Casa de la playa..."
              value={householdName}
              onChange={e => setHouseholdName(e.target.value)}
              style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: 12, padding: '14px 16px', fontSize: 15, color: 'var(--ink)', outline: 'none', fontFamily: 'var(--font-instrument)', width: '100%' }}
            />
          </div>

          <button
            onClick={() => setStep(2)}
            disabled={!householdName}
            style={{ background: 'var(--ink)', color: '#fff', border: 'none', borderRadius: 12, padding: '16px', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-syne)', opacity: !householdName ? .5 : 1 }}>
            Continuar →
          </button>
        </div>
      )}

      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-syne)', fontSize: 26, fontWeight: 800, marginBottom: 8 }}>
              ¿Quiénes viven aquí? 👥
            </div>
            <div style={{ fontSize: 14, color: 'var(--ink3)' }}>
              Define los miembros y qué % del presupuesto corresponde a cada uno
            </div>
          </div>

          {/* Members */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {members.map((m, i) => (
              <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <input
                  type="text"
                  placeholder={`Miembro ${i + 1}`}
                  value={m.name}
                  onChange={e => updateMember(i, 'name', e.target.value)}
                  style={{ flex: 1, background: 'transparent', border: 'none', fontSize: 15, fontWeight: 500, color: 'var(--ink)', outline: 'none', fontFamily: 'var(--font-instrument)' }}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input
                    type="number"
                    value={m.share}
                    min={0}
                    max={100}
                    onChange={e => updateMember(i, 'share', Number(e.target.value))}
                    style={{ width: 52, background: 'var(--surface2)', border: '1.5px solid var(--border)', borderRadius: 8, padding: '6px 4px', fontSize: 16, fontWeight: 700, textAlign: 'center', fontFamily: 'var(--font-syne)', color: 'var(--ink)', outline: 'none' }}
                  />
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink3)' }}>%</span>
                </div>
                {members.length > 2 && (
                  <button onClick={() => removeMember(i)} style={{ background: 'none', border: 'none', color: 'var(--coral)', cursor: 'pointer', fontSize: 18, padding: 4 }}>×</button>
                )}
              </div>
            ))}
          </div>

          {/* Total */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: sharesOk ? 'rgba(184,240,74,.08)' : 'rgba(255,107,74,.08)', border: `1px solid ${sharesOk ? 'rgba(184,240,74,.3)' : 'rgba(255,107,74,.3)'}`, borderRadius: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Total porcentajes</span>
            <span style={{ fontFamily: 'var(--font-syne)', fontSize: 16, fontWeight: 800, color: sharesOk ? 'var(--lime-dk)' : 'var(--coral)' }}>
              {totalShare}% {sharesOk ? '✓' : `— faltan ${100 - totalShare}%`}
            </span>
          </div>

          <button
            onClick={addMember}
            style={{ background: 'transparent', border: '1.5px dashed var(--border)', borderRadius: 12, padding: '12px', fontSize: 14, fontWeight: 600, cursor: 'pointer', color: 'var(--ink3)', fontFamily: 'var(--font-syne)' }}>
            + Agregar miembro
          </button>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => setStep(1)}
              style={{ flex: 1, background: 'transparent', border: '1.5px solid var(--border)', borderRadius: 12, padding: '14px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-syne)' }}>
              ← Atrás
            </button>
            <button
              onClick={createHousehold}
              disabled={!sharesOk || loading}
              style={{ flex: 2, background: 'var(--ink)', color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-syne)', opacity: !sharesOk || loading ? .5 : 1 }}>
              {loading ? 'Creando...' : 'Crear hogar 🏠'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}