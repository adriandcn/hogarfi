'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type Member = { name: string; income: number; share: number }
type Goal = { name: string; icon: string; targetAmount: number; monthlyTarget: number }

const GOAL_CATS = [
  { icon: '🚗', label: 'Auto' },
  { icon: '🏠', label: 'Casa' },
  { icon: '🏖️', label: 'Vacaciones' },
  { icon: '📚', label: 'Educacion' },
  { icon: '🛡️', label: 'Emergencia' },
  { icon: '🎯', label: 'Otro' },
]

const BUDGET_CATS = [
  { name: 'Comida', icon: '🛒', color: '#5a8a00' },
  { name: 'Renta', icon: '🏠', color: '#3b82f6' },
  { name: 'Servicios', icon: '⚡', color: '#f59e0b' },
  { name: 'Transporte', icon: '🚗', color: '#8b5cf6' },
  { name: 'Entretenimiento', icon: '🎬', color: '#ef4444' },
  { name: 'Salud', icon: '💊', color: '#10b981' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)

  // Step 1
  const [householdName, setHouseholdName] = useState('')

  // Step 2
  const [myName, setMyName] = useState('')
  const [members, setMembers] = useState<Member[]>([
    { name: '', income: 0, share: 60 },
    { name: '', income: 0, share: 40 },
  ])

  // Step 3
  const [goals, setGoals] = useState<Goal[]>([])
  const [newGoalIcon, setNewGoalIcon] = useState('🚗')
  const [newGoalName, setNewGoalName] = useState('')
  const [newGoalTarget, setNewGoalTarget] = useState('')
  const [newGoalMonthly, setNewGoalMonthly] = useState(300)
  const [showGoalForm, setShowGoalForm] = useState(false)

  // Step 4
  const [budgets, setBudgets] = useState<Record<string, number>>({})

  const TOTAL_STEPS = 4
  const suggestions = ['Casa Familiar', 'Hogar 2026', 'Apartamento', 'Familia']

  useEffect(() => {
    fetch('/api/auth/get-session')
      .then(r => r.json())
      .then(data => {
        if (data?.user?.name) {
          const name = data.user.name.split(' ')[0]
          setMyName(name)
          setMembers(prev => {
            const updated = [...prev]
            updated[0] = { ...updated[0], name }
            return updated
          })
        }
      })
      .catch(() => {})
  }, [])

  function recalcShares(updatedMembers: Member[]) {
    const totalIncome = updatedMembers.reduce((s, m) => s + (m.income || 0), 0)
    if (totalIncome === 0) return updatedMembers
    return updatedMembers.map(m => ({
      ...m,
      share: Math.round((m.income / totalIncome) * 100),
    }))
  }

  function updateMember(i: number, field: keyof Member, value: string | number) {
    setMembers(prev => {
      const updated = prev.map((m, idx) => idx === i ? { ...m, [field]: value } : m)
      if (field === 'income') return recalcShares(updated)
      return updated
    })
  }

  function addMember() {
    setMembers(prev => recalcShares([...prev, { name: '', income: 0, share: 0 }]))
  }

  function removeMember(i: number) {
    setMembers(prev => recalcShares(prev.filter((_, idx) => idx !== i)))
  }

  function addGoal() {
    if (!newGoalName || !newGoalTarget) return
    setGoals(prev => [...prev, {
      name: newGoalName,
      icon: newGoalIcon,
      targetAmount: parseFloat(newGoalTarget),
      monthlyTarget: newGoalMonthly,
    }])
    setNewGoalName('')
    setNewGoalTarget('')
    setNewGoalMonthly(300)
    setShowGoalForm(false)
  }

  const totalShare = members.reduce((s, m) => s + m.share, 0)
  const sharesOk = Math.abs(totalShare - 100) < 1
  const totalIncome = members.reduce((s, m) => s + m.income, 0)
  const totalGoalMonthly = goals.reduce((s, g) => s + g.monthlyTarget, 0)
  const totalBudget = Object.values(budgets).reduce((s, v) => s + v, 0)
  const libre = totalIncome - totalGoalMonthly - totalBudget

  const newGoalMonths = newGoalMonthly > 0 && parseFloat(newGoalTarget) > 0
    ? Math.ceil(parseFloat(newGoalTarget) / newGoalMonthly) : null

  const colors = [
    { bg: '#c9f26a', color: '#1a1814' },
    { bg: '#dbeafe', color: '#1e40af' },
    { bg: '#fef3c7', color: '#92400e' },
    { bg: '#ede9fe', color: '#5b21b6' },
    { bg: '#fce7f3', color: '#9d174d' },
  ]

  async function createHousehold() {
    if (!householdName || !sharesOk) return
    setLoading(true)
    try {
      const res = await fetch('/api/household/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: householdName,
          members: members.map(m => ({ name: m.name, share: m.share, income: m.income })),
          goals,
          budgets: BUDGET_CATS
            .filter(c => budgets[c.name] > 0)
            .map(c => ({ categoryName: c.name, icon: c.icon, color: c.color, amount: budgets[c.name] })),
        }),
      })
      if (res.ok) router.push('/welcome')
      else { alert('Error creando el hogar'); setLoading(false) }
    } catch {
      alert('Error de conexion')
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--off)', display: 'flex', flexDirection: 'column' }}>

      {/* PROGRESS */}
      <div style={{ padding: '56px 24px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div style={{ display: 'flex', gap: 5 }}>
            {Array.from({ length: TOTAL_STEPS }).map((_, s) => (
              <div key={s} style={{ height: 5, borderRadius: 999, background: s < step ? 'var(--title)' : 'var(--border)', width: s + 1 === step ? 24 : 5, transition: 'all .3s' }} />
            ))}
          </div>
          <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--muted)' }}>Paso {step} de {TOTAL_STEPS}</span>
        </div>

        {/* STEP 1 — NOMBRE */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--green-dk)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 8 }}>Tu hogar</div>
              <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-.02em', lineHeight: 1.15, marginBottom: 12 }}>
                Dale un nombre a tu hogar
              </div>
              <div style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6 }}>
                Puede ser el apellido de la familia o el nombre del lugar.
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 8 }}>Nombre del hogar</div>
              <input type="text" placeholder="ej. Hogar Martinez" value={householdName}
                onChange={e => setHouseholdName(e.target.value)}
                style={{ width: '100%', height: 52, background: 'var(--white)', border: '1.5px solid ' + (householdName ? 'var(--title)' : 'var(--border)'), borderRadius: 'var(--r-sm)', padding: '0 16px', fontSize: 16, fontWeight: 500, color: 'var(--title)', outline: 'none' }}
              />
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--muted)', marginBottom: 10 }}>Sugerencias</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {suggestions.map(s => (
                  <button key={s} onClick={() => setHouseholdName(s)}
                    style={{ padding: '7px 14px', background: householdName === s ? 'var(--title)' : 'var(--white)', color: householdName === s ? '#fff' : 'var(--body)', border: '1.5px solid ' + (householdName === s ? 'var(--title)' : 'var(--border)'), borderRadius: 999, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2 — MIEMBROS E INGRESOS */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--green-dk)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 8 }}>Miembros</div>
              <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-.02em', lineHeight: 1.15, marginBottom: 12 }}>
                Quienes viven aqui?
              </div>
              <div style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6 }}>
                Agrega el ingreso mensual de cada uno — el sistema calcula automaticamente cuanto le corresponde pagar a cada miembro.
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {members.map((m, i) => {
                const c = colors[i % colors.length]
                return (
                  <div key={i} style={{ background: 'var(--white)', border: '1.5px solid ' + (i === 0 ? 'var(--title)' : 'var(--border)'), borderRadius: 'var(--r-sm)', padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: c.color, flexShrink: 0 }}>
                        {m.name[0] ?? '?'}
                      </div>
                      <input type="text" placeholder={i === 0 ? 'Tu nombre' : 'Nombre del miembro'}
                        value={m.name}
                        onChange={e => updateMember(i, 'name', e.target.value)}
                        style={{ flex: 1, border: 'none', background: 'transparent', fontSize: 15, fontWeight: 600, color: 'var(--title)', outline: 'none' }}
                      />
                      {i === 0 && <span style={{ fontSize: 11, color: 'var(--muted)', background: 'var(--soft)', padding: '2px 8px', borderRadius: 999 }}>Admin</span>}
                      {i > 0 && members.length > 2 && (
                        <button onClick={() => removeMember(i)}
                          style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: 20, padding: 4 }}>×</button>
                      )}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 5 }}>Ingreso mensual</div>
                        <div style={{ position: 'relative' }}>
                          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: 'var(--muted)', fontFamily: 'var(--mono)' }}>$</span>
                          <input type="number" placeholder="0" value={m.income || ''}
                            onChange={e => updateMember(i, 'income', Number(e.target.value))}
                            style={{ width: '100%', height: 40, background: 'var(--soft)', border: '1px solid var(--border)', borderRadius: 8, padding: '0 10px 0 24px', fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 600, color: 'var(--title)', outline: 'none' }}
                          />
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 5 }}>Le corresponde</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <input type="number" value={m.share} min={0} max={100}
                            onChange={e => updateMember(i, 'share', Number(e.target.value))}
                            style={{ width: '100%', height: 40, background: 'var(--soft)', border: '1px solid var(--border)', borderRadius: 8, fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 600, textAlign: 'center', color: 'var(--title)', outline: 'none' }}
                          />
                          <span style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 600, flexShrink: 0 }}>%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}

              <button onClick={addMember}
                style={{ padding: '12px', border: '1.5px dashed var(--border)', borderRadius: 'var(--r-sm)', background: 'transparent', fontSize: 13, fontWeight: 600, color: 'var(--muted)', cursor: 'pointer' }}>
                + Agregar miembro
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: sharesOk ? 'rgba(201,242,106,.12)' : 'rgba(255,90,60,.06)', border: '1px solid ' + (sharesOk ? 'rgba(201,242,106,.4)' : 'rgba(255,90,60,.2)'), borderRadius: 'var(--r-sm)' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Total</div>
                {totalIncome > 0 && <div style={{ fontSize: 11, color: 'var(--muted)' }}>Hogar gana ${totalIncome.toLocaleString()}/mes</div>}
              </div>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 18, fontWeight: 500, color: sharesOk ? 'var(--green-dk)' : 'var(--red)' }}>
                {totalShare}% {sharesOk ? '✓' : '— faltan ' + (100 - totalShare) + '%'}
              </span>
            </div>
          </div>
        )}

        {/* STEP 3 — METAS */}
        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--green-dk)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 8 }}>Metas</div>
              <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-.02em', lineHeight: 1.15, marginBottom: 12 }}>
                Para que estan ahorrando?
              </div>
              <div style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6 }}>
                Opcional — pueden agregar metas despues. Las metas se descuentan del ingreso antes del presupuesto de gastos.
              </div>
            </div>

            {goals.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {goals.map((g, i) => {
                  const months = g.monthlyTarget > 0 ? Math.ceil(g.targetAmount / g.monthlyTarget) : null
                  return (
                    <div key={i} style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: '#faeeda', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{g.icon}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{g.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                          ${g.monthlyTarget}/mes · {months ? months + ' meses' : ''}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 600 }}>${g.targetAmount.toLocaleString()}</div>
                        <button onClick={() => setGoals(prev => prev.filter((_, idx) => idx !== i))}
                          style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: 18 }}>×</button>
                      </div>
                    </div>
                  )
                })}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--soft)', borderRadius: 'var(--r-sm)' }}>
                  <span style={{ fontSize: 13, color: 'var(--muted)' }}>Apartado en metas</span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 700 }}>${totalGoalMonthly}/mes</span>
                </div>
              </div>
            )}

            {showGoalForm ? (
              <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 16, padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>Nueva meta</div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 7 }}>Para que es?</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {GOAL_CATS.map(c => (
                      <button key={c.icon} onClick={() => { setNewGoalIcon(c.icon); if (!newGoalName) setNewGoalName(c.label) }}
                        style={{ padding: '6px 11px', background: newGoalIcon === c.icon ? 'var(--title)' : 'var(--soft)', border: 'none', borderRadius: 999, fontSize: 12, fontWeight: 500, cursor: 'pointer', color: newGoalIcon === c.icon ? '#fff' : 'var(--body)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        {c.icon} {c.label}
                      </button>
                    ))}
                  </div>
                </div>
                <input type="text" placeholder="Nombre de la meta" value={newGoalName} onChange={e => setNewGoalName(e.target.value)}
                  style={{ height: 44, background: 'var(--soft)', border: '1px solid var(--border)', borderRadius: 8, padding: '0 14px', fontSize: 14, color: 'var(--title)', outline: 'none' }} />
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontFamily: 'var(--mono)', fontSize: 16, color: 'var(--muted)' }}>$</span>
                  <input type="number" placeholder="Monto total" value={newGoalTarget} onChange={e => setNewGoalTarget(e.target.value)}
                    style={{ width: '100%', height: 48, background: 'var(--soft)', border: '1px solid var(--border)', borderRadius: 8, padding: '0 14px 0 30px', fontFamily: 'var(--mono)', fontSize: 18, fontWeight: 600, color: 'var(--title)', outline: 'none' }} />
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>Ahorro mensual</span>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 700 }}>${newGoalMonthly}/mes</span>
                  </div>
                  <input type="range" min={50} max={2000} step={50} value={newGoalMonthly} onChange={e => setNewGoalMonthly(Number(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--title)' }} />
                </div>
                {newGoalMonths && (
                  <div style={{ background: newGoalMonths <= 12 ? 'rgba(201,242,106,.1)' : 'rgba(255,200,50,.08)', border: '1px solid ' + (newGoalMonths <= 12 ? 'rgba(201,242,106,.3)' : 'rgba(255,200,50,.2)'), borderRadius: 10, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>Lo logran en</div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 20, fontWeight: 700, color: newGoalMonths <= 12 ? 'var(--green-dk)' : 'var(--body)' }}>{newGoalMonths} meses</div>
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setShowGoalForm(false)}
                    style={{ flex: 1, height: 44, background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', color: 'var(--body)' }}>
                    Cancelar
                  </button>
                  <button onClick={addGoal} disabled={!newGoalName || !newGoalTarget}
                    style={{ flex: 2, height: 44, background: 'var(--title)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: !newGoalName || !newGoalTarget ? .4 : 1 }}>
                    Agregar meta
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowGoalForm(true)}
                style={{ padding: '13px', border: '1.5px dashed var(--border)', borderRadius: 'var(--r-sm)', background: 'transparent', fontSize: 13, fontWeight: 600, color: 'var(--muted)', cursor: 'pointer' }}>
                + Agregar meta
              </button>
            )}
          </div>
        )}

        {/* STEP 4 — PRESUPUESTO */}
        {step === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--green-dk)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 8 }}>Presupuesto</div>
              <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-.02em', lineHeight: 1.15, marginBottom: 12 }}>
                Cuanto gastan al mes?
              </div>
              <div style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6 }}>
                Opcional — pueden ajustarlo despues. Esto les permite ver cuanto les queda libre cada mes.
              </div>
            </div>

            {totalIncome > 0 && (
              <div style={{ background: 'var(--title)', borderRadius: 14, padding: '14px 16px' }}>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,.4)', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 10 }}>Distribucion mensual</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 18, fontWeight: 700, color: '#ff8a70' }}>${totalBudget.toLocaleString()}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,.35)' }}>Gastos</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 18, fontWeight: 700, color: '#378add' }}>${totalGoalMonthly.toLocaleString()}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,.35)' }}>Metas</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 18, fontWeight: 700, color: libre >= 0 ? '#c9f26a' : '#ff8a70' }}>${Math.abs(libre).toLocaleString()}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,.35)' }}>{libre >= 0 ? 'Libre' : 'Excedido'}</div>
                  </div>
                </div>
                <div style={{ height: 5, background: 'rgba(255,255,255,.08)', borderRadius: 999, overflow: 'hidden', display: 'flex' }}>
                  <div style={{ width: Math.min((totalBudget / totalIncome) * 100, 100) + '%', background: '#ff8a70', transition: 'width .3s' }} />
                  <div style={{ width: Math.min((totalGoalMonthly / totalIncome) * 100, 100) + '%', background: '#378add', transition: 'width .3s' }} />
                  <div style={{ flex: 1, background: 'rgba(255,255,255,.06)' }} />
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {BUDGET_CATS.map(cat => (
                <div key={cat.name} style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                    {cat.icon}
                  </div>
                  <div style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>{cat.name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ fontSize: 13, color: 'var(--muted)', fontFamily: 'var(--mono)' }}>$</span>
                    <input type="number" placeholder="0" value={budgets[cat.name] || ''}
                      onChange={e => setBudgets(prev => ({ ...prev, [cat.name]: Number(e.target.value) }))}
                      style={{ width: 80, height: 38, background: 'var(--soft)', border: '1px solid var(--border)', borderRadius: 8, fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 600, textAlign: 'right', paddingRight: 8, color: 'var(--title)', outline: 'none' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div style={{ padding: '24px', marginTop: 'auto' }}>
        <div style={{ display: 'flex', gap: 10 }}>
          {step > 1 && (
            <button onClick={() => setStep(s => s - 1)}
              style={{ flex: 1, height: 52, background: 'transparent', border: '1.5px solid var(--border)', borderRadius: 'var(--r-sm)', fontSize: 15, fontWeight: 600, cursor: 'pointer', color: 'var(--body)' }}>
              ← Atras
            </button>
          )}
          {step < TOTAL_STEPS ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={step === 1 ? !householdName : step === 2 ? !sharesOk : false}
              style={{ flex: step > 1 ? 2 : 1, height: 52, background: 'var(--title)', color: '#fff', border: 'none', borderRadius: 'var(--r-sm)', fontSize: 15, fontWeight: 700, cursor: 'pointer', opacity: (step === 1 && !householdName) || (step === 2 && !sharesOk) ? .4 : 1 }}>
              {step === 3 ? (goals.length === 0 ? 'Saltar por ahora →' : 'Continuar →') : 'Continuar →'}
            </button>
          ) : (
            <button onClick={createHousehold} disabled={loading}
              style={{ flex: 2, height: 52, background: 'var(--title)', color: '#fff', border: 'none', borderRadius: 'var(--r-sm)', fontSize: 15, fontWeight: 700, cursor: 'pointer', opacity: loading ? .4 : 1 }}>
              {loading ? 'Creando hogar...' : 'Crear hogar'}
            </button>
          )}
        </div>
        {(step === 3 || step === 4) && (
          <div style={{ textAlign: 'center', marginTop: 12, fontSize: 12, color: 'var(--muted)' }}>
            Puedes configurar esto despues en cualquier momento
          </div>
        )}
      </div>
    </div>
  )
}