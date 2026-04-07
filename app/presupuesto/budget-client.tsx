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
  { name: 'Comida', icon: '🛒', color: '#b8f04a' },
  { name: 'Servicios', icon: '⚡', color: '#4a9eff' },
  { name: 'Entretenimiento', icon: '🎬', color: '#ff6b4a' },
  { name: 'Transporte', icon: '🚗', color: '#9b7fe8' },
  { name: 'Salud', icon: '💊', color: '#f5a623' },
  { name: 'Hogar', icon: '🏠', color: '#4ade80' },
]

export default function BudgetClient() {
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
    const res = await fetch('/api/budget')
    const data = await res.json()
    setBudgets(data.budgets ?? [])
    setLoading(false)
  }

  async function addBudget() {
    if (!newAmount) return
    setSaving(true)
    const cat = DEFAULT_CATEGORIES.find(c => c.name === newCat) ?? DEFAULT_CATEGORIES[0]
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
    setSaving(false)
  }

  const totalBudget = budgets.reduce((s, b) => s + b.amount, 0)
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0)
  const pct = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', maxWidth: 430, margin: '0 auto' }}>

      {/* HEADER */}
      <div style={{ background: 'var(--ink)', padding: '24px 20px 20px' }}>
        <div style={{ fontFamily: 'var(--font-syne)', fontSize: 24, fontWeight: 800, color: '#fff', marginBottom: 16 }}>
          Presupuesto
        </div>

        {/* Month nav */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <button
            onClick={() => {
              if (month === 1) { setMonth(12); setYear(y => y - 1) }
              else setMonth(m => m - 1)
            }}
            style={{ background: 'rgba(255,255,255,.1)', border: 'none', color: '#fff', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', fontSize: 16 }}>
            ‹
          </button>
          <div style={{ fontFamily: 'var(--font-syne)', fontSize: 16, fontWeight: 600, color: '#fff' }}>
            {monthNames[month - 1]} {year}
          </div>
          <button
            onClick={() => {
              if (month === 12) { setMonth(1); setYear(y => y + 1) }
              else setMonth(m => m + 1)
            }}
            style={{ background: 'rgba(255,255,255,.1)', border: 'none', color: '#fff', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', fontSize: 16 }}>
            ›
          </button>
        </div>

        {/* Totales */}
        {totalBudget > 0 && (
          <div style={{ background: 'rgba(255,255,255,.06)', borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,.5)' }}>Gastado</span>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,.5)' }}>Presupuesto</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontFamily: 'var(--font-syne)', fontSize: 22, fontWeight: 800, color: pct > 100 ? '#ff6b4a' : '#fff' }}>
                ${totalSpent.toFixed(0)}
              </span>
              <span style={{ fontFamily: 'var(--font-syne)', fontSize: 22, fontWeight: 800, color: 'rgba(255,255,255,.5)' }}>
                ${totalBudget.toFixed(0)}
              </span>
            </div>
            <div style={{ height: 6, background: 'rgba(255,255,255,.1)', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: 99, background: pct > 100 ? '#ff6b4a' : '#b8f04a', width: `${Math.min(pct, 100)}%`, transition: 'width .6s' }}/>
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', marginTop: 6, textAlign: 'right' }}>
              {pct}% usado · ${(totalBudget - totalSpent).toFixed(0)} restantes
            </div>
          </div>
        )}
      </div>

      <div style={{ padding: '16px 20px', paddingBottom: 120 }}>

        {/* LISTA DE CATEGORIAS */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--ink3)' }}>Cargando...</div>
        ) : budgets.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
            <div style={{ fontFamily: 'var(--font-syne)', fontSize: 16, fontWeight: 700, marginBottom: 8 }}>
              Sin presupuesto aún
            </div>
            <div style={{ fontSize: 13, color: 'var(--ink3)', marginBottom: 20 }}>
              Define cuánto quieres gastar en cada categoría
            </div>
          </div>
        ) : (
          <div style={{ borderRadius: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column', marginBottom: 12 }}>
            {budgets.map((b, i) => {
              const pctB = b.amount > 0 ? Math.min(Math.round((b.spent / b.amount) * 100), 100) : 0
              const over = b.spent > b.amount
              return (
                <div key={b.id} style={{ background: 'var(--surface)', padding: '14px 16px', display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 10, alignItems: 'center', borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ fontSize: 22 }}>{b.category.icon}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{b.category.name}</div>
                    <div style={{ height: 5, background: 'var(--surface2)', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 99, background: over ? 'var(--coral)' : b.category.color, width: `${pctB}%`, transition: 'width .6s' }}/>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'var(--font-syne)', fontSize: 14, fontWeight: 700, color: over ? 'var(--coral)' : 'var(--ink)' }}>
                      ${b.spent.toFixed(0)}
                    </div>
                    <div style={{ fontSize: 10, color: over ? 'var(--coral)' : 'var(--ink3)' }}>
                      {over ? `⚠ +$${(b.spent - b.amount).toFixed(0)}` : `/ $${b.amount.toFixed(0)}`}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ADD BUDGET */}
        {!showAdd ? (
          <button
            onClick={() => setShowAdd(true)}
            style={{ width: '100%', background: 'transparent', border: '1.5px dashed var(--border)', borderRadius: 14, padding: '14px', fontSize: 14, fontWeight: 600, cursor: 'pointer', color: 'var(--ink3)', fontFamily: 'var(--font-syne)' }}>
            + Agregar categoría
          </button>
        ) : (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontFamily: 'var(--font-syne)', fontSize: 15, fontWeight: 700 }}>Nueva categoría</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink3)', letterSpacing: '.08em', textTransform: 'uppercase' }}>Categoría</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {DEFAULT_CATEGORIES.map(c => (
                  <button
                    key={c.name}
                    onClick={() => setNewCat(c.name)}
                    style={{ padding: '7px 12px', background: newCat === c.name ? 'var(--ink)' : 'var(--surface2)', border: 'none', borderRadius: 99, fontSize: 12, fontWeight: 500, cursor: 'pointer', color: newCat === c.name ? '#fff' : 'var(--ink)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    {c.icon} {c.name}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink3)', letterSpacing: '.08em', textTransform: 'uppercase' }}>Límite mensual</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontFamily: 'var(--font-syne)', fontSize: 18, fontWeight: 700, color: 'var(--ink3)' }}>$</span>
                <input
                  type="number"
                  placeholder="0"
                  value={newAmount}
                  onChange={e => setNewAmount(e.target.value)}
                  style={{ width: '100%', background: 'var(--surface2)', border: '1.5px solid var(--border)', borderRadius: 12, padding: '12px 12px 12px 32px', fontFamily: 'var(--font-syne)', fontSize: 22, fontWeight: 700, color: 'var(--ink)', outline: 'none' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setShowAdd(false)}
                style={{ flex: 1, background: 'transparent', border: '1.5px solid var(--border)', borderRadius: 12, padding: '12px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-syne)' }}>
                Cancelar
              </button>
              <button
                onClick={addBudget}
                disabled={!newAmount || saving}
                style={{ flex: 2, background: 'var(--ink)', color: '#fff', border: 'none', borderRadius: 12, padding: '12px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-syne)', opacity: !newAmount || saving ? .5 : 1 }}>
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 
