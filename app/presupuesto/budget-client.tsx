'use client'
import { useState, useEffect } from 'react'

type Budget = {
  id: string
  amount: number
  spent: number
  month: number
  year: number
  category: {
    id: string
    name: string
    icon: string
    color: string
  }
}

const DEFAULT_CATEGORIES = [
  { name: 'Comida', icon: '🛒', color: '#5a8a00' },
  { name: 'Servicios', icon: '⚡', color: '#3b82f6' },
  { name: 'Entretenimiento', icon: '🎬', color: '#ef4444' },
  { name: 'Transporte', icon: '🚗', color: '#8b5cf6' },
  { name: 'Salud', icon: '💊', color: '#f59e0b' },
  { name: 'Hogar', icon: '🏠', color: '#10b981' },
  { name: 'Otro', icon: '📦', color: '#9b9690' },
]

export default function BudgetClient({ isSetup = false }: { isSetup?: boolean }) {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [loading, setLoading] = useState(true)
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [year, setYear] = useState(new Date().getFullYear())
  const [showAdd, setShowAdd] = useState(false)
  const [newCat, setNewCat] = useState(DEFAULT_CATEGORIES[0].name)
  const [newAmount, setNewAmount] = useState('')
  const [saving, setSaving] = useState(false)

  const monthNames = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

  useEffect(() => {
    loadBudgets()
  }, [month, year])

  async function loadBudgets() {
    setLoading(true)
    try {
      const res = await fetch('/api/budget')
      const data = await res.json()
      setBudgets(data.budgets ?? [])
    } finally {
      setLoading(false)
    }
  }

  async function addBudget() {
    if (!newAmount) return
    setSaving(true)
    const cat = DEFAULT_CATEGORIES.find(c => c.name === newCat) ?? DEFAULT_CATEGORIES[0]
    try {
      const res = await fetch('/api/budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryName: cat.name,
          icon: cat.icon,
          color: cat.color,
          amount: parseFloat(newAmount),
          month,
          year,
        }),
      })
      if (res.ok) {
        await loadBudgets()
        setNewAmount('')
        setShowAdd(false)
      }
    } finally {
      setSaving(false)
    }
  }

  const totalBudget = budgets.reduce((s, b) => s + b.amount, 0)
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0)
  const pct = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0

  return (
    <div style={{ minHeight: '100vh', background: 'var(--off)', paddingBottom: 100 }}>

      {/* HEADER */}
      <div style={{ background: 'var(--title)', padding: '52px 20px 20px' }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: '#fff', letterSpacing: '-.02em', marginBottom: 16 }}>
          Presupuesto
        </div>

        {/* Month nav */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <button
            onClick={() => { if (month === 1) { setMonth(12); setYear(y => y - 1) } else setMonth(m => m - 1) }}
            style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,.1)', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            ‹
          </button>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>
            {monthNames[month - 1]} {year}
          </div>
          <button
            onClick={() => { if (month === 12) { setMonth(1); setYear(y => y + 1) } else setMonth(m => m + 1) }}
            style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,.1)', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            ›
          </button>
        </div>

        {/* Total progress */}
        {totalBudget > 0 && (
          <div style={{ background: 'rgba(255,255,255,.06)', borderRadius: 14, padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 4 }}>Gastado</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 26, fontWeight: 500, color: pct > 100 ? '#ff8a70' : '#fff' }}>
                  ${totalSpent.toFixed(0)}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 4 }}>Limite</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 26, fontWeight: 500, color: 'rgba(255,255,255,.4)' }}>
                  ${totalBudget.toFixed(0)}
                </div>
              </div>
            </div>
            <div style={{ height: 5, background: 'rgba(255,255,255,.08)', borderRadius: 999, overflow: 'hidden', marginBottom: 6 }}>
              <div style={{ height: '100%', borderRadius: 999, background: pct > 100 ? 'var(--red)' : 'var(--green)', width: Math.min(pct, 100) + '%', transition: 'width .6s' }} />
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,.35)', textAlign: 'right' }}>
              {pct}% usado · ${(totalBudget - totalSpent).toFixed(0)} restantes
            </div>
          </div>
        )}
      </div>

      {/* SETUP BANNER */}
      {isSetup && (
        <div style={{ padding: '16px 20px 0' }}>
          <div style={{ background: 'rgba(201,242,106,.1)', border: '1px solid rgba(201,242,106,.3)', borderRadius: 14, padding: '14px 16px', marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--green-dk)', marginBottom: 4 }}>
              Configura tu presupuesto mensual
            </div>
            <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>
              Define cuanto quieren gastar en cada categoria. Puedes configurarlo ahora o hacerlo despues desde la app.
            </div>
          </div>
          
            <button
  onClick={() => window.location.href = '/dashboard'}
  style={{ width: '100%', display: 'block', textAlign: 'center', padding: '13px', fontSize: 14, fontWeight: 600, color: 'var(--muted)', border: '1.5px solid var(--border)', borderRadius: 'var(--r-sm)', background: 'transparent', cursor: 'pointer', marginBottom: 4 }}>
  Saltar por ahora
</button>
        </div>
      )}

      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>

        {/* LISTA */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)', fontSize: 14 }}>Cargando...</div>
        ) : budgets.length === 0 && !showAdd ? (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
            <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 8, letterSpacing: '-.01em' }}>Sin presupuesto aun</div>
            <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>
              Define cuanto quieres gastar en cada categoria del hogar
            </div>
          </div>
        ) : (
          <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
            {budgets.map((b, i) => {
              const pctB = b.amount > 0 ? Math.min(Math.round((b.spent / b.amount) * 100), 100) : 0
              const over = b.spent > b.amount
              return (
                <div key={b.id} style={{ padding: '14px 16px', borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                      {b.category.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 1 }}>{b.category.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                        ${b.spent.toFixed(0)} de ${b.amount.toFixed(0)}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 15, fontWeight: 500, color: over ? 'var(--red)' : 'var(--title)' }}>
                        {over ? '+$' + (b.spent - b.amount).toFixed(0) : '$' + (b.amount - b.spent).toFixed(0)}
                      </div>
                      <div style={{ fontSize: 11, color: over ? 'var(--red)' : 'var(--muted)' }}>
                        {over ? 'excedido' : 'restante'}
                      </div>
                    </div>
                  </div>
                  <div style={{ height: 5, background: 'var(--soft)', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 999, background: over ? 'var(--red)' : b.category.color, width: pctB + '%', transition: 'width .6s' }} />
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ADD FORM */}
        {showAdd ? (
          <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 16, padding: '18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>Nueva categoria</div>

            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 8 }}>Categoria</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {DEFAULT_CATEGORIES.map(c => (
                  <button key={c.name} onClick={() => setNewCat(c.name)}
                    style={{ padding: '7px 12px', background: newCat === c.name ? 'var(--title)' : 'var(--soft)', border: 'none', borderRadius: 999, fontSize: 12, fontWeight: 500, cursor: 'pointer', color: newCat === c.name ? '#fff' : 'var(--body)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    {c.icon} {c.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 8 }}>Limite mensual</div>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontFamily: 'var(--mono)', fontSize: 20, color: 'var(--muted)' }}>$</span>
                <input
                  type="number"
                  placeholder="0"
                  value={newAmount}
                  onChange={e => setNewAmount(e.target.value)}
                  style={{ width: '100%', height: 56, background: 'var(--soft)', border: '1.5px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '0 16px 0 36px', fontFamily: 'var(--mono)', fontSize: 24, fontWeight: 500, color: 'var(--title)', outline: 'none' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => { setShowAdd(false); setNewAmount('') }}
                style={{ flex: 1, height: 48, background: 'transparent', border: '1.5px solid var(--border)', borderRadius: 'var(--r-sm)', fontSize: 14, fontWeight: 600, cursor: 'pointer', color: 'var(--body)' }}>
                Cancelar
              </button>
              <button onClick={addBudget} disabled={!newAmount || saving}
                style={{ flex: 2, height: 48, background: 'var(--title)', color: '#fff', border: 'none', borderRadius: 'var(--r-sm)', fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: !newAmount || saving ? .4 : 1 }}>
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowAdd(true)}
            style={{ width: '100%', padding: '14px', border: '1.5px dashed var(--border)', borderRadius: 14, background: 'transparent', fontSize: 14, fontWeight: 600, cursor: 'pointer', color: 'var(--muted)' }}>
            + Agregar categoria
          </button>
        )}
      </div>
    </div>
  )
}