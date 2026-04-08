'use client'
import { useState, useEffect } from 'react'

type MonthData = {
  month: number
  year: number
  total: number
  count: number
  byCategory: { name: string; icon: string; color: string; total: number }[]
  byMember: { name: string; paid: number }[]
}

export default function ReportesClient() {
  const [data, setData] = useState<{ monthlyData: MonthData[]; budgets: any[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeMonth, setActiveMonth] = useState(0)

  const monthNames = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

  useEffect(() => {
    fetch('/api/reportes')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: 'var(--ink3)', fontSize: 14 }}>Cargando reportes...</div>
    </div>
  )

  if (!data || !data.monthlyData?.length) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
        <div style={{ fontFamily: 'var(--font-syne)', fontSize: 16, fontWeight: 700 }}>Sin datos aun</div>
      </div>
    </div>
  )

  const current = data.monthlyData[activeMonth]
  const prev = data.monthlyData[activeMonth + 1]
  const diff = prev ? current.total - prev.total : 0
  const maxCategory = Math.max(...current.byCategory.map(c => c.total), 1)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', maxWidth: 430, margin: '0 auto', paddingBottom: 100 }}>

      <div style={{ background: 'var(--ink)', padding: '24px 20px 20px' }}>
        <div style={{ fontFamily: 'var(--font-syne)', fontSize: 24, fontWeight: 800, color: '#fff', marginBottom: 16 }}>
          Reportes
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {data.monthlyData.map((m, i) => (
            <button
              key={i}
              onClick={() => setActiveMonth(i)}
              style={{ flex: 1, padding: '8px', background: activeMonth === i ? '#fff' : 'rgba(255,255,255,.1)', border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: 'var(--font-syne)', fontSize: 13, fontWeight: 700, color: activeMonth === i ? 'var(--ink)' : 'rgba(255,255,255,.6)' }}>
              {monthNames[m.month - 1]}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '18px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink3)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 12 }}>
            Resumen
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--ink3)', marginBottom: 4 }}>Total gastado</div>
              <div style={{ fontFamily: 'var(--font-syne)', fontSize: 26, fontWeight: 800 }}>
                ${current.total.toFixed(0)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--ink3)', marginBottom: 4 }}>vs mes anterior</div>
              <div style={{ fontFamily: 'var(--font-syne)', fontSize: 26, fontWeight: 800, color: diff > 0 ? 'var(--coral)' : 'var(--lime-dk)' }}>
                {prev ? (diff > 0 ? '+' : '') + '$' + Math.abs(diff).toFixed(0) : '—'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--ink3)', marginBottom: 4 }}>Gastos registrados</div>
              <div style={{ fontFamily: 'var(--font-syne)', fontSize: 26, fontWeight: 800 }}>
                {current.count}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--ink3)', marginBottom: 4 }}>Promedio por gasto</div>
              <div style={{ fontFamily: 'var(--font-syne)', fontSize: 26, fontWeight: 800 }}>
                ${current.count > 0 ? (current.total / current.count).toFixed(0) : '0'}
              </div>
            </div>
          </div>
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink3)', letterSpacing: '.08em', textTransform: 'uppercase' }}>
              Por categoria
            </div>
          </div>
          {current.byCategory.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--ink3)', fontSize: 13 }}>
              Sin gastos este mes
            </div>
          ) : current.byCategory.map((cat, i) => {
            const pct = Math.round((cat.total / maxCategory) * 100)
            const budget = data.budgets.find(b => b.category?.name === cat.name)
            const over = budget && cat.total > budget.amount
            return (
              <div key={i} style={{ padding: '12px 16px', borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 18 }}>{cat.icon}</span>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{cat.name}</span>
                    {over && (
                      <span style={{ fontSize: 10, background: 'rgba(255,107,74,.15)', color: 'var(--coral)', borderRadius: 4, padding: '2px 6px', fontWeight: 700 }}>
                        Excedido
                      </span>
                    )}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'var(--font-syne)', fontSize: 14, fontWeight: 700, color: over ? 'var(--coral)' : 'var(--ink)' }}>
                      ${cat.total.toFixed(0)}
                    </div>
                    {budget && (
                      <div style={{ fontSize: 10, color: 'var(--ink3)' }}>/ ${budget.amount.toFixed(0)}</div>
                    )}
                  </div>
                </div>
                <div style={{ height: 5, background: 'var(--surface2)', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 99, background: over ? 'var(--coral)' : (cat.color || '#b8f04a'), width: pct + '%', transition: 'width .6s' }}/>
                </div>
              </div>
            )
          })}
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink3)', letterSpacing: '.08em', textTransform: 'uppercase' }}>
              Por miembro
            </div>
          </div>
          {current.byMember.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--ink3)', fontSize: 13 }}>
              Sin gastos este mes
            </div>
          ) : current.byMember.map((m, i) => {
            const pct = current.total > 0 ? Math.round((m.paid / current.total) * 100) : 0
            return (
              <div key={i} style={{ padding: '13px 16px', borderTop: i > 0 ? '1px solid var(--border)' : 'none', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#b8f04a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#1a1814', flexShrink: 0 }}>
                  {m.name[0]}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{m.name.split(' ')[0]}</div>
                  <div style={{ height: 4, background: 'var(--surface2)', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 99, background: '#b8f04a', width: pct + '%' }}/>
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontFamily: 'var(--font-syne)', fontSize: 14, fontWeight: 700 }}>${m.paid.toFixed(0)}</div>
                  <div style={{ fontSize: 10, color: 'var(--ink3)' }}>{pct}% del total</div>
                </div>
              </div>
            )
          })}
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '16px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink3)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 14 }}>
            Tendencia 3 meses
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 80 }}>
            {[...data.monthlyData].reverse().map((m, i) => {
              const maxTotal = Math.max(...data.monthlyData.map(d => d.total), 1)
              const h = Math.max((m.total / maxTotal) * 100, 4)
              const isActive = i === data.monthlyData.length - 1 - activeMonth
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink3)' }}>${m.total.toFixed(0)}</div>
                  <div style={{ width: '100%', height: h + '%', background: isActive ? 'var(--ink)' : 'var(--surface2)', borderRadius: '4px 4px 0 0', transition: 'height .6s' }}/>
                  <div style={{ fontSize: 11, color: 'var(--ink3)' }}>{monthNames[m.month - 1]}</div>
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </div>
  )
}