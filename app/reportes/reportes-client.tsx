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
    <div style={{ minHeight: '100vh', background: 'var(--off)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: 14, color: 'var(--muted)' }}>Cargando reportes...</div>
    </div>
  )

  if (!data || !data.monthlyData?.length) return (
    <div style={{ minHeight: '100vh', background: 'var(--off)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', textAlign: 'center' }}>
      <div style={{ fontSize: 40, marginBottom: 16 }}>📊</div>
      <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, letterSpacing: '-.01em' }}>Sin datos aun</div>
      <div style={{ fontSize: 14, color: 'var(--muted)' }}>Agrega gastos para ver tus reportes</div>
    </div>
  )

  const current = data.monthlyData[activeMonth]
  const prev = data.monthlyData[activeMonth + 1]
  const diff = prev ? current.total - prev.total : 0
  const maxCategory = Math.max(...current.byCategory.map(c => c.total), 1)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--off)', paddingBottom: 100 }}>

      {/* HEADER */}
      <div style={{ background: 'var(--title)', padding: '52px 20px 20px' }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: '#fff', letterSpacing: '-.02em', marginBottom: 16 }}>
          Reportes
        </div>
        <div style={{ display: 'flex', gap: 6, background: 'rgba(255,255,255,.08)', borderRadius: 10, padding: 3 }}>
          {data.monthlyData.map((m, i) => (
            <button key={i} onClick={() => setActiveMonth(i)}
              style={{ flex: 1, padding: '8px 4px', background: activeMonth === i ? '#fff' : 'transparent', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 700, color: activeMonth === i ? 'var(--title)' : 'rgba(255,255,255,.5)' }}>
              {monthNames[m.month - 1]}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* RESUMEN */}
        <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 16, padding: '18px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 14 }}>
            Resumen
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>Total gastado</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 28, fontWeight: 500 }}>${current.total.toFixed(0)}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>vs mes anterior</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 28, fontWeight: 500, color: diff > 0 ? 'var(--red)' : 'var(--green-dk)' }}>
                {prev ? (diff > 0 ? '+' : '') + '$' + Math.abs(diff).toFixed(0) : '—'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>Gastos</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 28, fontWeight: 500 }}>{current.count}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>Promedio</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 28, fontWeight: 500 }}>
                ${current.count > 0 ? (current.total / current.count).toFixed(0) : '0'}
              </div>
            </div>
          </div>
        </div>

        {/* POR CATEGORIA */}
        <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: '.08em', textTransform: 'uppercase' }}>
              Por categoria
            </div>
          </div>
          {current.byCategory.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
              Sin gastos este mes
            </div>
          ) : current.byCategory.map((cat, i) => {
            const pct = Math.round((cat.total / maxCategory) * 100)
            const budget = data.budgets.find(b => b.category?.name === cat.name)
            const over = budget && cat.total > budget.amount
            return (
              <div key={i} style={{ padding: '12px 16px', borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 18 }}>{cat.icon}</span>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{cat.name}</span>
                    {over && (
                      <span style={{ fontSize: 10, background: 'var(--red-lt)', color: 'var(--red)', borderRadius: 4, padding: '2px 6px', fontWeight: 700 }}>
                        Excedido
                      </span>
                    )}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 500, color: over ? 'var(--red)' : 'var(--title)' }}>
                      ${cat.total.toFixed(0)}
                    </div>
                    {budget && (
                      <div style={{ fontSize: 10, color: 'var(--muted)' }}>/ ${budget.amount.toFixed(0)}</div>
                    )}
                  </div>
                </div>
                <div style={{ height: 5, background: 'var(--soft)', borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 999, background: over ? 'var(--red)' : (cat.color || 'var(--green-dk)'), width: pct + '%', transition: 'width .6s' }} />
                </div>
              </div>
            )
          })}
        </div>

        {/* POR MIEMBRO */}
        <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: '.08em', textTransform: 'uppercase' }}>
              Por miembro
            </div>
          </div>
          {current.byMember.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
              Sin gastos este mes
            </div>
          ) : current.byMember.map((m, i) => {
            const pct = current.total > 0 ? Math.round((m.paid / current.total) * 100) : 0
            return (
              <div key={i} style={{ padding: '13px 16px', borderTop: i > 0 ? '1px solid var(--border)' : 'none', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: 'var(--title)', flexShrink: 0 }}>
                  {m.name[0]}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 5 }}>{m.name.split(' ')[0]}</div>
                  <div style={{ height: 4, background: 'var(--soft)', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 999, background: 'var(--green-dk)', width: pct + '%' }} />
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 500 }}>${m.paid.toFixed(0)}</div>
                  <div style={{ fontSize: 10, color: 'var(--muted)' }}>{pct}% del total</div>
                </div>
              </div>
            )
          })}
        </div>

        {/* TENDENCIA */}
        <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 16, padding: '16px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 16 }}>
            Tendencia 3 meses
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 80 }}>
            {[...data.monthlyData].reverse().map((m, i) => {
              const maxTotal = Math.max(...data.monthlyData.map(d => d.total), 1)
              const h = Math.max((m.total / maxTotal) * 100, 4)
              const isActive = i === data.monthlyData.length - 1 - activeMonth
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)' }}>${m.total.toFixed(0)}</div>
                  <div style={{ width: '100%', height: h + '%', background: isActive ? 'var(--title)' : 'var(--soft)', borderRadius: '4px 4px 0 0', transition: 'height .6s' }} />
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>{monthNames[m.month - 1]}</div>
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </div>
  )
}