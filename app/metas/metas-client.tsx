'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

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

export default function MetasClient() {
  const router = useRouter()
  const [goals, setGoals] = useState<Goal[]>([])
  const [myMemberId, setMyMemberId] = useState('')
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)

  useEffect(() => {
    fetch('/api/goals')
      .then(r => r.json())
      .then(d => {
        setGoals(d.goals ?? [])
        setMyMemberId(d.myMemberId ?? '')
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  function getMonthsLeft(goal: Goal) {
    if (goal.monthlyTarget <= 0) return null
    const remaining = goal.targetAmount - goal.currentAmount
    return Math.ceil(remaining / goal.monthlyTarget)
  }

  function getPct(goal: Goal) {
    return Math.min(Math.round((goal.currentAmount / goal.targetAmount) * 100), 100)
  }

  const catColors: Record<string, string> = {
    '🚗': '#faeeda', '🏠': '#eaf3de', '🏖️': '#e6f1fb',
    '📚': '#eeedfe', '🛡️': '#fcebeb', '🎯': '#f0ede8',
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--off)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: 14, color: 'var(--muted)' }}>Cargando...</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--off)', paddingBottom: 100 }}>

      <div style={{ background: 'var(--title)', padding: '52px 20px 20px' }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: '#fff', letterSpacing: '-.02em', marginBottom: 4 }}>
          Metas del hogar
        </div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,.4)' }}>
          Ahorra juntos hacia lo que importa
        </div>
      </div>

      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {!loading && goals.length === 0 && !showNew && (
          <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 16, padding: '40px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🎯</div>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Sin metas aun</div>
            <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 20 }}>
              Define hacia donde quieren llegar juntos — un auto, vacaciones, la entrada de una casa.
            </div>
            <button onClick={() => setShowNew(true)}
              style={{ background: 'var(--title)', color: '#fff', border: 'none', borderRadius: 999, padding: '10px 24px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              Crear primera meta
            </button>
          </div>
        )}

        {goals.map(goal => {
          const pct = getPct(goal)
          const months = getMonthsLeft(goal)
          const bg = catColors[goal.icon] ?? '#f0ede8'
          const thisMonthContribs = goal.contributions.filter(c => {
            const d = new Date(c.createdAt)
            const now = new Date()
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
          })

          return (
            <div key={goal.id} onClick={() => router.push('/metas/' + goal.id)}
              style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 16, padding: '16px', cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
                  {goal.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 2 }}>{goal.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                    {months !== null
                      ? months <= 0 ? 'Meta alcanzada!' : months + ' meses restantes'
                      : 'Sin proyeccion definida'
                    }
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 15, fontWeight: 500 }}>${goal.currentAmount.toFixed(0)}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>de ${goal.targetAmount.toFixed(0)}</div>
                </div>
              </div>

              <div style={{ height: 6, background: 'var(--soft)', borderRadius: 999, overflow: 'hidden', marginBottom: 8 }}>
                <div style={{ height: '100%', borderRadius: 999, background: pct >= 100 ? 'var(--green-dk)' : 'var(--title)', width: pct + '%', transition: 'width .6s' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>{pct}% completado</div>
                {thisMonthContribs.length > 0 && (
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--green-dk)', background: 'rgba(201,242,106,.1)', padding: '2px 8px', borderRadius: 999 }}>
                    +${thisMonthContribs.reduce((s, c) => s + c.amount, 0).toFixed(0)} este mes
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {!showNew ? (
          <button onClick={() => setShowNew(true)}
            style={{ width: '100%', padding: '14px', border: '1.5px dashed var(--border)', borderRadius: 14, background: 'transparent', fontSize: 14, fontWeight: 600, cursor: 'pointer', color: 'var(--muted)' }}>
            + Nueva meta
          </button>
        ) : (
          <NuevoMetaForm
            onCreated={goal => { setGoals(prev => [goal, ...prev]); setShowNew(false) }}
            onCancel={() => setShowNew(false)}
          />
        )}
      </div>
    </div>
  )
}

function NuevoMetaForm({ onCreated, onCancel }: { onCreated: (g: any) => void; onCancel: () => void }) {
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('🎯')
  const [target, setTarget] = useState('')
  const [monthly, setMonthly] = useState(300)
  const [saving, setSaving] = useState(false)

  const cats = [
    { icon: '🚗', label: 'Auto' },
    { icon: '🏠', label: 'Casa' },
    { icon: '🏖️', label: 'Vacaciones' },
    { icon: '📚', label: 'Educacion' },
    { icon: '🛡️', label: 'Emergencia' },
    { icon: '🎯', label: 'Otro' },
  ]

  const targetNum = parseFloat(target) || 0
  const months = monthly > 0 && targetNum > 0 ? Math.ceil(targetNum / monthly) : null

  async function handleCreate() {
    if (!name || !target) return
    setSaving(true)
    const res = await fetch('/api/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, icon, targetAmount: targetNum, monthlyTarget: monthly }),
    })
    const data = await res.json()
    setSaving(false)
    if (res.ok) onCreated(data)
  }

  return (
    <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 16, padding: '18px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 15, fontWeight: 700 }}>Nueva meta familiar</div>

      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 8 }}>Para que es?</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {cats.map(c => (
            <button key={c.icon} onClick={() => { setIcon(c.icon); if (!name) setName(c.label) }}
              style={{ padding: '7px 12px', background: icon === c.icon ? 'var(--title)' : 'var(--soft)', border: 'none', borderRadius: 999, fontSize: 13, fontWeight: 500, cursor: 'pointer', color: icon === c.icon ? '#fff' : 'var(--body)', display: 'flex', alignItems: 'center', gap: 5 }}>
              {c.icon} {c.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 8 }}>Nombre</div>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="ej. Toyota Corolla 2025"
          style={{ width: '100%', height: 48, background: 'var(--soft)', border: '1.5px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '0 14px', fontSize: 15, color: 'var(--title)', outline: 'none' }} />
      </div>

      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 8 }}>Cuanto necesitan?</div>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontFamily: 'var(--mono)', fontSize: 18, color: 'var(--muted)' }}>$</span>
          <input type="number" value={target} onChange={e => setTarget(e.target.value)} placeholder="0"
            style={{ width: '100%', height: 52, background: 'var(--soft)', border: '1.5px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '0 14px 0 34px', fontFamily: 'var(--mono)', fontSize: 22, fontWeight: 500, color: 'var(--title)', outline: 'none' }} />
        </div>
      </div>

      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 8 }}>
          Cuanto pueden ahorrar al mes?
        </div>
        <div style={{ background: 'var(--soft)', borderRadius: 'var(--r-sm)', padding: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>$50</span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 20, fontWeight: 700 }}>${monthly}/mes</span>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>$2,000</span>
          </div>
          <input type="range" min={50} max={2000} step={50} value={monthly}
            onChange={e => setMonthly(Number(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--title)' }} />
        </div>
      </div>

      {months !== null && (
        <div style={{ background: months <= 12 ? 'rgba(201,242,106,.1)' : 'rgba(255,200,50,.08)', border: '1px solid ' + (months <= 12 ? 'rgba(201,242,106,.3)' : 'rgba(255,200,50,.2)'), borderRadius: 12, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--title)', marginBottom: 1 }}>Lo logran en</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>
              {new Date(Date.now() + months * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('es', { month: 'long', year: 'numeric' })}
            </div>
          </div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 24, fontWeight: 700, color: months <= 12 ? 'var(--green-dk)' : 'var(--body)' }}>
            {months} <span style={{ fontSize: 13, fontWeight: 500 }}>meses</span>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={onCancel}
          style={{ flex: 1, height: 48, background: 'transparent', border: '1.5px solid var(--border)', borderRadius: 'var(--r-sm)', fontSize: 14, fontWeight: 600, cursor: 'pointer', color: 'var(--body)' }}>
          Cancelar
        </button>
        <button onClick={handleCreate} disabled={!name || !target || saving}
          style={{ flex: 2, height: 48, background: 'var(--title)', color: '#fff', border: 'none', borderRadius: 'var(--r-sm)', fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: !name || !target || saving ? .4 : 1 }}>
          {saving ? 'Creando...' : 'Crear meta'}
        </button>
      </div>
    </div>
  )
}