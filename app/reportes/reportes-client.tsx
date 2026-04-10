'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type MonthData = {
  month: number
  year: number
  total: number
  count: number
  byCategory: { name: string; icon: string; color: string; total: number }[]
  byMember: { name: string; paid: number }[]
}

type Goal = {
  id: string
  name: string
  icon: string
  targetAmount: number
  currentAmount: number
  monthlyTarget: number
  contributions: { amount: number; createdAt: string }[]
}

type Reimbursement = {
  from: string
  to: string
  amount: number
  fromName: string
  toName: string
}

const monthNamesShort = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
const monthNamesFull = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

const catColors: Record<string, string> = {
  '🚗': '#faeeda', '🏠': '#eaf3de', '🏖️': '#e6f1fb',
  '📚': '#eeedfe', '🛡️': '#fcebeb', '🎯': '#f0ede8',
}

const avatarColors = [
  { bg: '#c9f26a', color: '#1a1814' },
  { bg: '#dbeafe', color: '#1e40af' },
  { bg: '#fef3c7', color: '#92400e' },
  { bg: '#ede9fe', color: '#5b21b6' },
]

export default function ReportesClient() {
  const router = useRouter()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeMonth, setActiveMonth] = useState(0)
  const [settling, setSettling] = useState<string | null>(null)
  const [settledKeys, setSettledKeys] = useState<Set<string>>(new Set())
  const [abonoGoalId, setAbonoGoalId] = useState<string | null>(null)
  const [abonoAmount, setAbonoAmount] = useState('')
  const [abonoSaving, setAbonoSaving] = useState(false)
  const [showAllMetas, setShowAllMetas] = useState(false)
  const [showAllLiquidar, setShowAllLiquidar] = useState(false)

  useEffect(() => {
    fetch('/api/reportes')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function handleSettle(r: Reimbursement) {
    const key = r.from + r.to
    setSettling(key)
    try {
      await fetch('/api/liquidar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromMemberId: r.from,
          toMemberId: r.to,
          amount: r.amount,
          householdId: data.householdId,
        }),
      })
      setSettledKeys(prev => new Set([...prev, key]))
    } finally {
      setSettling(null)
    }
  }

  async function handleAbono() {
    if (!abonoAmount || !abonoGoalId || !data?.myMemberId) return
    setAbonoSaving(true)
    try {
      const res = await fetch('/api/goals/' + abonoGoalId + '/contribute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parseFloat(abonoAmount), memberId: data.myMemberId }),
      })
      if (res.ok) {
        const updated = await fetch('/api/reportes')
        const d = await updated.json()
        setData(d)
        setAbonoGoalId(null)
        setAbonoAmount('')
      }
    } finally {
      setAbonoSaving(false)
    }
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--off)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: 14, color: 'var(--muted)' }}>Cargando...</div>
    </div>
  )

  if (!data?.monthlyData?.length) return (
    <div style={{ minHeight: '100vh', background: 'var(--off)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', textAlign: 'center' }}>
      <div style={{ fontSize: 40, marginBottom: 16 }}>📊</div>
      <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Sin datos aun</div>
      <div style={{ fontSize: 14, color: 'var(--muted)' }}>Agrega gastos para ver tus reportes</div>
    </div>
  )

  const current = data.monthlyData[activeMonth]
  const prev = data.monthlyData[activeMonth + 1]
  const diff = prev ? current.total - prev.total : 0

  const goals: Goal[] = data.goals ?? []
  const reimbursements: Reimbursement[] = (data.reimbursements ?? []).filter((r: Reimbursement) => !settledKeys.has(r.from + r.to))

  const goalsThisMonth = goals.map(goal => {
    const monthContribs = goal.contributions.filter(c => {
      const d = new Date(c.createdAt)
      return d.getMonth() + 1 === current.month && d.getFullYear() === current.year
    })
    const monthAbonado = monthContribs.reduce((s: number, c: any) => s + c.amount, 0)
    const pct = Math.min(Math.round((goal.currentAmount / goal.targetAmount) * 100), 100)
    const monthsLeft = goal.monthlyTarget > 0
      ? Math.ceil((goal.targetAmount - goal.currentAmount) / goal.monthlyTarget)
      : null
    return { ...goal, monthAbonado, pct, monthsLeft }
  })

  const totalAbonado = goalsThisMonth.reduce((s, g) => s + g.monthAbonado, 0)
  const totalGoalMonthly = goals.reduce((s, g) => s + g.monthlyTarget, 0)
  const totalSpent = current.total

  const visibleGoals = showAllMetas ? goalsThisMonth : goalsThisMonth.slice(0, 2)
  const visibleReimbursements = showAllLiquidar ? reimbursements : reimbursements.slice(0, 2)

  const maxTotal = Math.max(...data.monthlyData.map((m: MonthData) => m.total), 1)

  const abonoGoal = goals.find(g => g.id === abonoGoalId)
  const quickAmounts = abonoGoal && abonoGoal.monthlyTarget > 0
    ? [Math.round(abonoGoal.monthlyTarget * 0.5), abonoGoal.monthlyTarget, Math.round(abonoGoal.monthlyTarget * 1.5)]
    : [100, 200, 500]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--off)', paddingBottom: 100 }}>

      <div style={{ background: 'var(--title)', padding: '52px 20px 20px' }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: '#fff', letterSpacing: '-.02em', marginBottom: 16 }}>
          Resumen del mes
        </div>
        <div style={{ display: 'flex', gap: 6, background: 'rgba(255,255,255,.08)', borderRadius: 10, padding: 3 }}>
          {data.monthlyData.map((m: MonthData, i: number) => (
            <button key={i} onClick={() => setActiveMonth(i)}
              style={{ flex: 1, padding: '8px 4px', background: activeMonth === i ? '#fff' : 'transparent', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 700, color: activeMonth === i ? 'var(--title)' : 'rgba(255,255,255,.5)' }}>
              {monthNamesShort[m.month - 1]} {m.year !== new Date().getFullYear() ? m.year : ''}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* RESUMEN 3 NUMEROS */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          <div style={{ background: 'rgba(255,90,60,.08)', border: '1px solid rgba(255,90,60,.15)', borderRadius: 14, padding: '12px 10px', textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: 'var(--red)', fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase', marginBottom: 4 }}>Gastado</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 18, fontWeight: 500, color: 'var(--red)' }}>${totalSpent.toFixed(0)}</div>
            {prev && (
              <div style={{ fontSize: 10, color: diff > 0 ? 'var(--red)' : 'var(--green-dk)', marginTop: 3, fontWeight: 600 }}>
                {diff > 0 ? '+' : ''}${Math.abs(diff).toFixed(0)} vs antes
              </div>
            )}
          </div>
          <div style={{ background: 'rgba(55,138,221,.08)', border: '1px solid rgba(55,138,221,.15)', borderRadius: 14, padding: '12px 10px', textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: '#185fa5', fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase', marginBottom: 4 }}>Metas</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 18, fontWeight: 500, color: '#185fa5' }}>${totalAbonado.toFixed(0)}</div>
            <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 3 }}>de ${totalGoalMonthly.toFixed(0)}/mes</div>
          </div>
          <div style={{ background: 'rgba(201,242,106,.08)', border: '1px solid rgba(201,242,106,.25)', borderRadius: 14, padding: '12px 10px', textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: 'var(--green-dk)', fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase', marginBottom: 4 }}>Num.</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 18, fontWeight: 500, color: 'var(--green-dk)' }}>{current.count}</div>
            <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 3 }}>
              ${current.count > 0 ? Math.round(current.total / current.count) : 0} prom.
            </div>
          </div>
        </div>

        {/* LIQUIDAR */}
        {reimbursements.length > 0 && (
          <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>Liquidar cuentas</div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>{reimbursements.length} transferencia{reimbursements.length !== 1 ? 's' : ''} pendiente{reimbursements.length !== 1 ? 's' : ''}</div>
              </div>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--red)' }} />
            </div>
            {visibleReimbursements.map((r, i) => {
              const key = r.from + r.to
              const isSettling = settling === key
              const fromIdx = (data.members ?? []).findIndex((m: any) => m.id === r.from)
              const toIdx = (data.members ?? []).findIndex((m: any) => m.id === r.to)
              const fromC = avatarColors[fromIdx % avatarColors.length]
              const toC = avatarColors[toIdx % avatarColors.length]
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: fromC.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: fromC.color }}>
                      {r.fromName[0]}
                    </div>
                    <span style={{ fontSize: 14, color: 'var(--muted)' }}>→</span>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: toC.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: toC.color }}>
                      {r.toName[0]}
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{r.fromName} paga a {r.toName}</div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 15, fontWeight: 700, color: 'var(--red)' }}>${r.amount.toFixed(0)}</div>
                  </div>
                  <button
                    onClick={() => handleSettle(r)}
                    disabled={!!isSettling}
                    style={{ padding: '7px 12px', background: 'var(--title)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', opacity: isSettling ? .5 : 1, flexShrink: 0 }}>
                    {isSettling ? '...' : 'Pagar'}
                  </button>
                </div>
              )
            })}
            {reimbursements.length > 2 && (
              <button onClick={() => setShowAllLiquidar(!showAllLiquidar)}
                style={{ width: '100%', padding: '10px', background: 'var(--soft)', border: 'none', borderTop: '1px solid var(--border)', fontSize: 12, fontWeight: 600, color: 'var(--muted)', cursor: 'pointer' }}>
                {showAllLiquidar ? 'Ver menos' : 'Ver ' + (reimbursements.length - 2) + ' mas'}
              </button>
            )}
          </div>
        )}

        {reimbursements.length === 0 && (
          <div style={{ background: 'rgba(201,242,106,.08)', border: '1px solid rgba(201,242,106,.25)', borderRadius: 14, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: 20 }}>✅</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--green-dk)' }}>Cuentas al dia</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>No hay transferencias pendientes</div>
            </div>
          </div>
        )}

        {/* METAS */}
        {goalsThisMonth.length > 0 && (
          <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>Metas</div>
              <a href="/metas" style={{ fontSize: 12, color: 'var(--muted)', textDecoration: 'none', fontWeight: 500 }}>Ver todas</a>
            </div>

            {visibleGoals.map((goal, i) => (
              <div key={goal.id} style={{ borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: catColors[goal.icon] ?? '#f0ede8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                      {goal.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>{goal.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                        ${goal.currentAmount.toFixed(0)} de ${goal.targetAmount.toFixed(0)}
                        {goal.monthsLeft !== null && goal.monthsLeft > 0 && <span> · {goal.monthsLeft} meses</span>}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      {goal.monthAbonado > 0 ? (
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--green-dk)', background: 'rgba(201,242,106,.12)', padding: '3px 8px', borderRadius: 999, marginBottom: 4 }}>
                          +${goal.monthAbonado.toFixed(0)} ✓
                        </div>
                      ) : (
                        <div style={{ fontSize: 11, color: 'var(--red)', fontWeight: 500, marginBottom: 4 }}>Sin abono</div>
                      )}
                      <button onClick={() => { setAbonoGoalId(goal.id); setAbonoAmount('') }}
                        style={{ padding: '4px 10px', background: 'var(--title)', color: '#fff', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                        + Abonar
                      </button>
                    </div>
                  </div>
                  <div style={{ height: 5, background: 'var(--soft)', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 999, background: goal.pct >= 100 ? 'var(--green-dk)' : 'var(--title)', width: goal.pct + '%', transition: 'width .5s' }} />
                  </div>
                </div>

                {abonoGoalId === goal.id && (
                  <div style={{ padding: '12px 16px', background: 'var(--soft)', borderTop: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 8 }}>Cuanto abonas?</div>
                    <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                      {quickAmounts.map(amt => (
                        <button key={amt} onClick={() => setAbonoAmount(amt.toString())}
                          style={{ flex: 1, height: 36, background: parseFloat(abonoAmount) === amt ? 'var(--title)' : 'var(--white)', color: parseFloat(abonoAmount) === amt ? '#fff' : 'var(--body)', border: '1px solid var(--border)', borderRadius: 8, fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                          ${amt}
                        </button>
                      ))}
                    </div>
                    <div style={{ position: 'relative', marginBottom: 8 }}>
                      <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontFamily: 'var(--mono)', fontSize: 16, color: 'var(--muted)' }}>$</span>
                      <input type="number" placeholder="Otro monto" value={abonoAmount} onChange={e => setAbonoAmount(e.target.value)}
                        style={{ width: '100%', height: 44, background: 'var(--white)', border: '1.5px solid var(--border)', borderRadius: 8, padding: '0 12px 0 28px', fontFamily: 'var(--mono)', fontSize: 16, fontWeight: 600, color: 'var(--title)', outline: 'none' }} />
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => setAbonoGoalId(null)}
                        style={{ flex: 1, height: 40, background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', color: 'var(--body)' }}>
                        Cancelar
                      </button>
                      <button onClick={handleAbono} disabled={!abonoAmount || abonoSaving}
                        style={{ flex: 2, height: 40, background: 'var(--title)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: !abonoAmount || abonoSaving ? .4 : 1 }}>
                        {abonoSaving ? 'Guardando...' : 'Confirmar abono'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {goalsThisMonth.length > 2 && (
              <button onClick={() => setShowAllMetas(!showAllMetas)}
                style={{ width: '100%', padding: '10px', background: 'var(--soft)', border: 'none', borderTop: '1px solid var(--border)', fontSize: 12, fontWeight: 600, color: 'var(--muted)', cursor: 'pointer' }}>
                {showAllMetas ? 'Ver menos' : 'Ver ' + (goalsThisMonth.length - 2) + ' mas'}
              </button>
            )}
          </div>
        )}

        {/* GASTOS POR CATEGORIA */}
        <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>Gastos por categoria</div>
          </div>
          {current.byCategory.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>Sin gastos este mes</div>
          ) : current.byCategory.map((cat: any, i: number) => {
            const maxCat = Math.max(...current.byCategory.map((c: any) => c.total), 1)
            const pct = Math.round((cat.total / maxCat) * 100)
            const budget = data.budgets.find((b: any) => b.category?.name === cat.name)
            const over = budget && cat.total > budget.amount
            return (
              <div key={i} style={{ padding: '10px 16px', borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 16 }}>{cat.icon}</span>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{cat.name}</span>
                    {over && <span style={{ fontSize: 10, background: 'rgba(255,90,60,.1)', color: 'var(--red)', borderRadius: 4, padding: '2px 6px', fontWeight: 700 }}>Excedido</span>}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 500, color: over ? 'var(--red)' : 'var(--title)' }}>${cat.total.toFixed(0)}</span>
                    {budget && <span style={{ fontSize: 11, color: 'var(--muted)' }}> / ${budget.amount.toFixed(0)}</span>}
                  </div>
                </div>
                <div style={{ height: 4, background: 'var(--soft)', borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 999, background: over ? 'var(--red)' : (cat.color || 'var(--green-dk)'), width: pct + '%', transition: 'width .5s' }} />
                </div>
              </div>
            )
          })}
        </div>

        {/* POR MIEMBRO */}
        {current.byMember.length > 0 && (
          <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>Quien pago mas</div>
            </div>
            {current.byMember.map((m: any, i: number) => {
              const pct = current.total > 0 ? Math.round((m.paid / current.total) * 100) : 0
              const c = avatarColors[i % avatarColors.length]
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px', borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: c.color, flexShrink: 0 }}>
                    {m.name[0]}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 5 }}>{m.name.split(' ')[0]}</div>
                    <div style={{ height: 4, background: 'var(--soft)', borderRadius: 999, overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 999, background: 'var(--green-dk)', width: pct + '%' }} />
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 500 }}>${m.paid.toFixed(0)}</div>
                    <div style={{ fontSize: 10, color: 'var(--muted)' }}>{pct}%</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* TENDENCIA */}
        <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 16, padding: '16px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Tendencia de gasto</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16 }}>Cuanto gastaron por mes</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 90 }}>
            {[...data.monthlyData].reverse().map((m: MonthData, i: number) => {
              const h = Math.max((m.total / maxTotal) * 100, 4)
              const isActive = i === data.monthlyData.length - 1 - activeMonth
              return (
                <div key={i} onClick={() => setActiveMonth(data.monthlyData.length - 1 - i)}
                  style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 600, color: isActive ? 'var(--title)' : 'var(--muted)' }}>
                    ${m.total.toFixed(0)}
                  </div>
                  <div style={{ width: '100%', height: h + '%', background: isActive ? 'var(--title)' : 'var(--soft)', borderRadius: '4px 4px 0 0', transition: 'all .4s' }} />
                  <div style={{ fontSize: 11, color: isActive ? 'var(--title)' : 'var(--muted)', fontWeight: isActive ? 700 : 400 }}>
                    {monthNamesShort[m.month - 1]}
                  </div>
                </div>
              )
            })}
          </div>
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>
            {data.monthlyData.length > 1 && diff !== 0 && (
              <span style={{ color: diff > 0 ? 'var(--red)' : 'var(--green-dk)', fontWeight: 600 }}>
                {diff > 0 ? 'Gastaron $' + Math.abs(diff).toFixed(0) + ' mas' : 'Ahorraron $' + Math.abs(diff).toFixed(0)} vs el mes anterior.
              </span>
            )}
            {' '}Toca una barra para ver ese mes en detalle.
          </div>
        </div>

      </div>
    </div>
  )
}