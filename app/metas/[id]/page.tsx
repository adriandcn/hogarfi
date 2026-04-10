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

export default function MetaDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [goal, setGoal] = useState<Goal | null>(null)
  const [members, setMembers] = useState<any[]>([])
  const [myMemberId, setMyMemberId] = useState('')
  const [loading, setLoading] = useState(true)
  const [showContrib, setShowContrib] = useState(false)
  const [contribAmount, setContribAmount] = useState('')
  const [contribNote, setContribNote] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/goals').then(r => r.json()),
      fetch('/api/household/me').then(r => r.json()),
    ]).then(([goalsData, householdData]) => {
      const found = goalsData.goals?.find((g: Goal) => g.id === id)
      setGoal(found ?? null)
      setMyMemberId(goalsData.myMemberId ?? '')
      setMembers(householdData.members ?? [])
      setLoading(false)
    })
  }, [id])

  async function addContribution() {
    if (!contribAmount || !myMemberId) return
    setSaving(true)
    const res = await fetch('/api/goals/' + id + '/contribute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: parseFloat(contribAmount), memberId: myMemberId, note: contribNote }),
    })
    if (res.ok) {
      const data = await res.json()
      setGoal(prev => prev ? {
        ...prev,
        currentAmount: prev.currentAmount + parseFloat(contribAmount),
        contributions: [{ ...data, member: members.find(m => m.id === myMemberId) }, ...prev.contributions],
      } : null)
      setContribAmount('')
      setContribNote('')
      setShowContrib(false)
    }
    setSaving(false)
  }

  if (loading || !goal) return (
    <div style={{ minHeight: '100vh', background: 'var(--off)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: 14, color: 'var(--muted)' }}>Cargando...</div>
    </div>
  )

  const pct = Math.min(Math.round((goal.currentAmount / goal.targetAmount) * 100), 100)
  const remaining = goal.targetAmount - goal.currentAmount
  const months = goal.monthlyTarget > 0 ? Math.ceil(remaining / goal.monthlyTarget) : null

  const thisMonthContribs = goal.contributions.filter(c => {
    const d = new Date(c.createdAt)
    const now = new Date()
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })

  const contribByMember: Record<string, number> = {}
  thisMonthContribs.forEach(c => {
    const key = c.member?.id ?? 'unknown'
    contribByMember[key] = (contribByMember[key] ?? 0) + c.amount
  })

  const catColors: Record<string, string> = {
    '🚗': '#faeeda', '🏠': '#eaf3de', '🏖️': '#e6f1fb',
    '📚': '#eeedfe', '🛡️': '#fcebeb', '🎯': '#f0ede8',
  }
  const iconBg = catColors[goal.icon] ?? '#f0ede8'

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
          <div style={{ width: 56, height: 56, borderRadius: 16, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0 }}>
            {goal.icon}
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: '-.01em' }}>{goal.name}</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,.4)', marginTop: 2 }}>
              {months !== null
                ? months <= 0 ? 'Meta alcanzada!' : months + ' meses restantes'
                : 'Sin proyeccion'}
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

        {months !== null && goal.monthlyTarget > 0 && (
          <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 16, padding: '16px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 12 }}>Proyeccion</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
              <div style={{ background: 'var(--soft)', borderRadius: 10, padding: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 4 }}>Ahorrando ${(goal.monthlyTarget * 0.6).toFixed(0)}/mes</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 16, fontWeight: 700, color: 'var(--red)' }}>
                  {Math.ceil(remaining / (goal.monthlyTarget * 0.6))} meses
                </div>
              </div>
              <div style={{ background: 'rgba(201,242,106,.1)', border: '1px solid rgba(201,242,106,.3)', borderRadius: 10, padding: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: 'var(--green-dk)', marginBottom: 4 }}>Ahorrando ${goal.monthlyTarget.toFixed(0)}/mes</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 16, fontWeight: 700, color: 'var(--green-dk)' }}>
                  {months} meses
                </div>
              </div>
            </div>
            {months > 6 && (
              <div style={{ fontSize: 12, color: 'var(--muted)', background: 'var(--soft)', borderRadius: 8, padding: '10px 12px', lineHeight: 1.5 }}>
                Aumentando $100 mas al mes llegarian {Math.ceil(remaining / (goal.monthlyTarget + 100))} meses antes.
              </div>
            )}
          </div>
        )}

        {members.length > 0 && Object.keys(contribByMember).length > 0 && (
          <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: '.08em', textTransform: 'uppercase' }}>Contribuciones este mes</div>
            </div>
            {members.map((m, i) => {
              const amt = contribByMember[m.id] ?? 0
              if (amt === 0) return null
              const c = colors[i % colors.length]
              return (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: c.color, flexShrink: 0 }}>
                    {(m.name ?? '?')[0]}
                  </div>
                  <div style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>{m.name?.split(' ')[0]}</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 15, fontWeight: 500, color: 'var(--green-dk)' }}>
                    +${amt.toFixed(0)}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {goal.contributions.length > 0 && (
          <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: '.08em', textTransform: 'uppercase' }}>Historial</div>
            </div>
            {goal.contributions.slice(0, 5).map((c, i) => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px', borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--muted)', flexShrink: 0 }}>
                  {(c.member?.name ?? '?')[0]}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{c.member?.name?.split(' ')[0] ?? 'Miembro'}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                    {new Date(c.createdAt).toLocaleDateString('es', { day: 'numeric', month: 'short' })}
                    {c.note ? ' · ' + c.note : ''}
                  </div>
                </div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 500, color: 'var(--green-dk)' }}>
                  +${c.amount.toFixed(0)}
                </div>
              </div>
            ))}
          </div>
        )}

        {showContrib && (
          <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 16, padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>Agregar ahorro</div>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontFamily: 'var(--mono)', fontSize: 18, color: 'var(--muted)' }}>$</span>
              <input type="number" placeholder="0" value={contribAmount} onChange={e => setContribAmount(e.target.value)}
                style={{ width: '100%', height: 52, background: 'var(--soft)', border: '1.5px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '0 14px 0 34px', fontFamily: 'var(--mono)', fontSize: 22, fontWeight: 500, color: 'var(--title)', outline: 'none' }} />
            </div>
            <input type="text" placeholder="Nota (opcional)" value={contribNote} onChange={e => setContribNote(e.target.value)}
              style={{ width: '100%', height: 44, background: 'var(--soft)', border: '1.5px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '0 14px', fontSize: 14, color: 'var(--title)', outline: 'none' }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setShowContrib(false)}
                style={{ flex: 1, height: 46, background: 'transparent', border: '1.5px solid var(--border)', borderRadius: 'var(--r-sm)', fontSize: 14, fontWeight: 600, cursor: 'pointer', color: 'var(--body)' }}>
                Cancelar
              </button>
              <button onClick={addContribution} disabled={!contribAmount || saving}
                style={{ flex: 2, height: 46, background: 'var(--title)', color: '#fff', border: 'none', borderRadius: 'var(--r-sm)', fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: !contribAmount || saving ? .4 : 1 }}>
                {saving ? 'Guardando...' : 'Agregar'}
              </button>
            </div>
          </div>
        )}
      </div>

      {!showContrib && (
        <div style={{ position: 'fixed', bottom: 72, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 430, padding: '16px 20px', background: 'linear-gradient(to top, var(--off) 70%, transparent)' }}>
          <button onClick={() => setShowContrib(true)}
            style={{ width: '100%', height: 52, background: 'var(--title)', color: '#fff', border: 'none', borderRadius: 'var(--r-sm)', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
            Agregar ahorro este mes
          </button>
        </div>
      )}
    </div>
  )
}