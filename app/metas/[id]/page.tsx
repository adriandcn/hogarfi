'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

type Contribution = {
  id: string
  amount: number
  note: string | null
  createdAt: string
  member: { id: string; name: string | null }
}

type Goal = {
  id: string
  name: string
  icon: string
  targetAmount: number
  currentAmount: number
  monthlyTarget: number
  deadline: string | null
  contributions: Contribution[]
}

const colors = [
  { bg: '#c9f26a', color: '#1a1814' },
  { bg: '#dbeafe', color: '#1e40af' },
  { bg: '#fef3c7', color: '#92400e' },
  { bg: '#ede9fe', color: '#5b21b6' },
]

const catColors: Record<string, string> = {
  '🚗': '#faeeda', '🏠': '#eaf3de', '🏖️': '#e6f1fb',
  '📚': '#eeedfe', '🛡️': '#fcebeb', '🎯': '#f0ede8',
}

export default function MetaDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [goal, setGoal] = useState<Goal | null>(null)
  const [members, setMembers] = useState<any[]>([])
  const [myMemberId, setMyMemberId] = useState('')
  const [loading, setLoading] = useState(true)
  const [confirmed, setConfirmed] = useState(false)

  const [showAbono, setShowAbono] = useState(false)
  const [abonoAmount, setAbonoAmount] = useState('')
  const [abonoNote, setAbonoNote] = useState('')
  const [abonoPayer, setAbonoPayer] = useState('')
  const [saving, setSaving] = useState(false)
  const [lastAbono, setLastAbono] = useState(0)

  useEffect(() => {
    Promise.all([
      fetch('/api/goals').then(r => r.json()),
      fetch('/api/household/me').then(r => r.json()),
    ]).then(([goalsData, householdData]) => {
      const found = goalsData.goals?.find((g: Goal) => g.id === id)
      setGoal(found ?? null)
      setMyMemberId(goalsData.myMemberId ?? '')
      setAbonoPayer(goalsData.myMemberId ?? '')
      setMembers(householdData.members ?? [])
      setLoading(false)
    })
  }, [id])

  async function handleAbono() {
    if (!abonoAmount || !abonoPayer) return
    setSaving(true)
    const amt = parseFloat(abonoAmount)
    const res = await fetch('/api/goals/' + id + '/contribute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: amt, memberId: abonoPayer, note: abonoNote }),
    })
    if (res.ok) {
      setLastAbono(amt)
      setGoal(prev => prev ? { ...prev, currentAmount: prev.currentAmount + amt } : null)
      setShowAbono(false)
      setConfirmed(true)
      setAbonoAmount('')
      setAbonoNote('')
    } else {
      alert('Error al registrar el abono')
    }
    setSaving(false)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--off)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: 14, color: 'var(--muted)' }}>Cargando...</div>
    </div>
  )

  if (!goal) return (
    <div style={{ minHeight: '100vh', background: 'var(--off)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: 14, color: 'var(--muted)' }}>Meta no encontrada</div>
    </div>
  )

  const pct = Math.min(Math.round((goal.currentAmount / goal.targetAmount) * 100), 100)
  const remaining = goal.targetAmount - goal.currentAmount
  const months = goal.monthlyTarget > 0 ? Math.ceil(remaining / goal.monthlyTarget) : null
  const monthsAfter = goal.monthlyTarget > 0 ? Math.ceil((remaining - lastAbono) / goal.monthlyTarget) : null
  const iconBg = catColors[goal.icon] ?? '#f0ede8'

  const now = new Date()
  const thisMonthContribs = goal.contributions.filter(c => {
    const d = new Date(c.createdAt)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })
  const thisMonthTotal = thisMonthContribs.reduce((s, c) => s + c.amount, 0)

  const quickAmounts = goal.monthlyTarget > 0
    ? [Math.round(goal.monthlyTarget * 0.5), goal.monthlyTarget, Math.round(goal.monthlyTarget * 1.5)]
    : [100, 200, 500]

  if (confirmed) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--off)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ background: 'var(--title)', padding: '52px 20px 28px', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, background: 'rgba(201,242,106,.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, margin: '0 auto 16px' }}>
            ✅
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 4 }}>Abono registrado</div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,.4)' }}>${lastAbono.toFixed(0)} a {goal.name}</div>
        </div>

        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 16, padding: '16px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 12 }}>
              Progreso actualizado
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 2 }}>Ahorrado</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 22, fontWeight: 700, color: 'var(--green-dk)' }}>${goal.currentAmount.toFixed(0)}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 2 }}>Meta</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 22, fontWeight: 700, color: 'var(--muted)' }}>${goal.targetAmount.toFixed(0)}</div>
              </div>
            </div>
            <div style={{ height: 8, background: 'var(--soft)', borderRadius: 999, overflow: 'hidden', marginBottom: 8 }}>
              <div style={{ height: '100%', borderRadius: 999, background: 'var(--green-dk)', width: pct + '%', transition: 'width .6s' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>{pct}% completado</div>
              {monthsAfter !== null && (
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--green-dk)' }}>{monthsAfter} meses restantes</div>
              )}
            </div>
          </div>

          {months !== null && monthsAfter !== null && months > monthsAfter && (
            <div style={{ background: 'rgba(201,242,106,.1)', border: '1px solid rgba(201,242,106,.3)', borderRadius: 14, padding: '14px 16px' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--green-dk)', marginBottom: 4 }}>
                {months - monthsAfter} {months - monthsAfter === 1 ? 'mes menos' : 'meses menos'} al objetivo
              </div>
              <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>
                Si mantienen este ritmo llegan en{' '}
                {new Date(Date.now() + monthsAfter * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('es', { month: 'long', year: 'numeric' })}.
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setConfirmed(false)}
              style={{ flex: 1, height: 48, background: 'var(--white)', border: '1.5px solid var(--border)', borderRadius: 'var(--r-sm)', fontSize: 14, fontWeight: 600, cursor: 'pointer', color: 'var(--body)' }}>
              Ver meta
            </button>
            <button onClick={() => router.push('/dashboard')}
              style={{ flex: 1, height: 48, background: 'var(--title)', color: '#fff', border: 'none', borderRadius: 'var(--r-sm)', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              Ir al inicio
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--off)', paddingBottom: 120 }}>

      <div style={{ background: 'var(--title)', padding: '52px 20px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <button onClick={() => router.back()} style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,.1)', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            ←
          </button>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>Meta familiar</div>
          <div style={{ width: 36 }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
          <div style={{ width: 52, height: 52, borderRadius: 16, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>
            {goal.icon}
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: '-.01em' }}>{goal.name}</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,.4)', marginTop: 2 }}>
              {months !== null ? months <= 0 ? 'Meta alcanzada!' : months + ' meses restantes' : 'Sin proyeccion'}
            </div>
          </div>
        </div>

        <div style={{ background: 'rgba(255,255,255,.06)', borderRadius: 14, padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,.4)', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 3 }}>Ahorrado</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 28, fontWeight: 500, color: 'var(--green)' }}>${goal.currentAmount.toFixed(0)}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,.4)', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 3 }}>Meta</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 28, fontWeight: 500, color: 'rgba(255,255,255,.35)' }}>${goal.targetAmount.toFixed(0)}</div>
            </div>
          </div>
          <div style={{ height: 8, background: 'rgba(255,255,255,.08)', borderRadius: 999, overflow: 'hidden', marginBottom: 8 }}>
            <div style={{ height: '100%', borderRadius: 999, background: 'var(--green)', width: pct + '%', transition: 'width .6s' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,.35)' }}>{pct}% completado</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,.35)' }}>Faltan ${remaining.toFixed(0)}</div>
          </div>
        </div>
      </div>

      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* ESTE MES */}
        <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 16, padding: '16px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 12 }}>
            Este mes
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>Meta mensual</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 700 }}>${goal.monthlyTarget.toFixed(0)}</div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>Abonado</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 700, color: thisMonthTotal > 0 ? 'var(--green-dk)' : 'var(--muted)' }}>
              ${thisMonthTotal.toFixed(0)}
            </div>
          </div>
          <div style={{ height: 5, background: 'var(--soft)', borderRadius: 999, overflow: 'hidden', marginBottom: 8 }}>
            <div style={{ height: '100%', borderRadius: 999, background: thisMonthTotal >= goal.monthlyTarget ? 'var(--green-dk)' : 'var(--title)', width: Math.min((thisMonthTotal / goal.monthlyTarget) * 100, 100) + '%' }} />
          </div>
          {thisMonthTotal === 0 ? (
            <div style={{ fontSize: 12, color: 'var(--red)', fontWeight: 500 }}>Sin abono este mes</div>
          ) : thisMonthTotal >= goal.monthlyTarget ? (
            <div style={{ fontSize: 12, color: 'var(--green-dk)', fontWeight: 600 }}>Meta mensual alcanzada ✓</div>
          ) : (
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>Faltan ${(goal.monthlyTarget - thisMonthTotal).toFixed(0)} para la meta del mes</div>
          )}
        </div>

        {/* FORMULARIO ABONO */}
        {showAbono ? (
          <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 16, padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>Registrar abono</div>

            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontFamily: 'var(--mono)', fontSize: 18, color: 'var(--muted)' }}>$</span>
              <input type="number" placeholder="0" value={abonoAmount} onChange={e => setAbonoAmount(e.target.value)} autoFocus
                style={{ width: '100%', height: 56, background: 'var(--soft)', border: '1.5px solid var(--title)', borderRadius: 'var(--r-sm)', padding: '0 14px 0 34px', fontFamily: 'var(--mono)', fontSize: 24, fontWeight: 700, color: 'var(--title)', outline: 'none' }} />
            </div>

            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 8 }}>Acceso rapido</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {quickAmounts.map(amt => (
                  <button key={amt} onClick={() => setAbonoAmount(amt.toString())}
                    style={{ flex: 1, height: 40, background: parseFloat(abonoAmount) === amt ? 'var(--title)' : 'var(--soft)', color: parseFloat(abonoAmount) === amt ? '#fff' : 'var(--body)', border: '1px solid ' + (parseFloat(abonoAmount) === amt ? 'var(--title)' : 'var(--border)'), borderRadius: 8, fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                    ${amt}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 8 }}>Quien abona?</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {members.map((m, i) => {
                  const c = colors[i % colors.length]
                  const selected = abonoPayer === m.id
                  return (
                    <button key={m.id} onClick={() => setAbonoPayer(m.id)}
                      style={{ flex: 1, padding: '10px 8px', background: selected ? 'var(--title)' : 'var(--white)', border: '1.5px solid ' + (selected ? 'var(--title)' : 'var(--border)'), borderRadius: 'var(--r-sm)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: selected ? 'rgba(255,255,255,.15)' : c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: selected ? '#fff' : c.color }}>
                        {(m.name ?? '?')[0]}
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 600, color: selected ? '#fff' : 'var(--body)' }}>{m.name?.split(' ')[0]}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <input type="text" placeholder="Nota (opcional)" value={abonoNote} onChange={e => setAbonoNote(e.target.value)}
              style={{ height: 44, background: 'var(--soft)', border: '1px solid var(--border)', borderRadius: 8, padding: '0 14px', fontSize: 14, color: 'var(--title)', outline: 'none' }} />

            {abonoAmount && parseFloat(abonoAmount) > 0 && (
              <div style={{ background: 'rgba(201,242,106,.1)', border: '1px solid rgba(201,242,106,.3)', borderRadius: 10, padding: '10px 14px' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--green-dk)', marginBottom: 2 }}>Impacto de este abono</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>
                  {months !== null && goal.monthlyTarget > 0
                    ? 'Llegas a $' + (goal.currentAmount + parseFloat(abonoAmount)).toFixed(0) + ' ahorrados. ' +
                      Math.ceil((remaining - parseFloat(abonoAmount)) / goal.monthlyTarget) + ' meses restantes.'
                    : 'Total ahorrado: $' + (goal.currentAmount + parseFloat(abonoAmount)).toFixed(0)
                  }
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setShowAbono(false)}
                style={{ flex: 1, height: 48, background: 'transparent', border: '1.5px solid var(--border)', borderRadius: 'var(--r-sm)', fontSize: 14, fontWeight: 600, cursor: 'pointer', color: 'var(--body)' }}>
                Cancelar
              </button>
              <button onClick={handleAbono} disabled={!abonoAmount || parseFloat(abonoAmount) <= 0 || saving}
                style={{ flex: 2, height: 48, background: 'var(--title)', color: '#fff', border: 'none', borderRadius: 'var(--r-sm)', fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: !abonoAmount || parseFloat(abonoAmount) <= 0 || saving ? .4 : 1 }}>
                {saving ? 'Guardando...' : 'Confirmar abono de $' + (parseFloat(abonoAmount) || 0).toFixed(0)}
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowAbono(true)}
            style={{ width: '100%', height: 52, background: 'var(--title)', color: '#fff', border: 'none', borderRadius: 'var(--r-sm)', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
            + Abonar a esta meta
          </button>
        )}

        {/* HISTORIAL */}
        {goal.contributions.length > 0 && (
          <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: '.08em', textTransform: 'uppercase' }}>Historial de abonos</div>
            </div>
            {goal.contributions.slice(0, 6).map((c, i) => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px', borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'var(--muted)', flexShrink: 0 }}>
                  {(c.member?.name ?? '?')[0]}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{c.member?.name?.split(' ')[0] ?? 'Miembro'}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                    {new Date(c.createdAt).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {c.note ? ' · ' + c.note : ''}
                  </div>
                </div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 700, color: 'var(--green-dk)' }}>
                  +${c.amount.toFixed(0)}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}