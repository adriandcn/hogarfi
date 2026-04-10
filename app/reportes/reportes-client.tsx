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

type Member = {
  id: string
  name: string
  defaultShare: number
}

const monthNamesShort = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

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
        setData(await updated.json())
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
      <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Sin datos aun</div>
      <div style={{ fontSize: 14, color: 'var(--muted)' }}>Agrega gastos para ver tus reportes</div>
    </div>
  )

  const current: MonthData = data.monthlyData[activeMonth]
  const prev: MonthData | undefined = data.monthlyData[activeMonth + 1]
  const diff = prev ? current.total - prev.total : 0

  const goals: Goal[] = data.goals ?? []
  const members: Member[] = data.members ?? []
  const reimbursements: Reimbursement[] = (data.reimbursements ?? []).filter(
    (r: Reimbursement) => !settledKeys.has(r.from + r.to)
  )

  // Budgets del mes activo (con fallback al mas reciente)
  const currentBudgetEntry = (data.budgetsByMonth ?? []).find(
    (b: any) => b.month === current.month && b.year === current.year
  )
  const currentBudgets: any[] = currentBudgetEntry?.budgets ?? []
  const hasBudget = currentBudgets.length > 0
  const totalBudget = currentBudgets.reduce((s: number, b: any) => s + b.amount, 0)
  const totalSpent = current.total
  const libre = hasBudget ? totalBudget - totalSpent : null
  const totalGoalMonthly = goals.reduce((s, g) => s + g.monthlyTarget, 0)

  const goalsThisMonth = goals.map(goal => {
    const monthContribs = goal.contributions.filter(c => {
      const d = new Date(c.createdAt)
      return d.getMonth() + 1 === current.month && d.getFullYear() === current.year
    })
    const monthAbonado = monthContribs.reduce((s, c: any) => s + c.amount, 0)
    const pct = Math.min(Math.round((goal.currentAmount / goal.targetAmount) * 100), 100)
    const monthsLeft = goal.monthlyTarget > 0
      ? Math.ceil((goal.targetAmount - goal.currentAmount) / goal.monthlyTarget)
      : null
    const quickAmounts = goal.monthlyTarget > 0
      ? [Math.round(goal.monthlyTarget * 0.5), goal.monthlyTarget, Math.round(goal.monthlyTarget * 1.5)]
      : [100, 200, 500]
    return { ...goal, monthAbonado, pct, monthsLeft, quickAmounts }
  })

  const totalAbonado = goalsThisMonth.reduce((s, g) => s + g.monthAbonado, 0)
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

        {/* 1 — 3 NUMEROS */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          <div style={{ background: 'rgba(255,90,60,.08)', border: '1px solid rgba(255,90,60,.15)', borderRadius: 12, padding: '12px 8px', textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: 'var(--red)', fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase', marginBottom: 4 }}>Gastado</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 18, fontWeight: 500, color: 'var(--red)' }}>${totalSpent.toFixed(0)}</div>
            {prev && (
              <div style={{ fontSize: 10, color: diff > 0 ? 'var(--red)' : 'var(--green-dk)', marginTop: 3, fontWeight: 600 }}>
                {diff > 0 ? '+' : ''}${Math.abs(diff).toFixed(0)} vs antes
              </div>
            )}
          </div>

          <div style={{ background: 'rgba(55,138,221,.08)', border: '1px solid rgba(55,138,221,.15)', borderRadius: 12, padding: '12px 8px', textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: '#185fa5', fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase', marginBottom: 4 }}>Metas</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 18, fontWeight: 500, color: '#185fa5' }}>${totalAbonado.toFixed(0)}</div>
            <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 3 }}>de ${totalGoalMonthly.toFixed(0)}/mes</div>
          </div>

          {hasBudget ? (
            <div style={{ background: libre! >= 0 ? 'rgba(201,242,106,.1)' : 'rgba(255,90,60,.08)', border: '1px solid ' + (libre! >= 0 ? 'rgba(201,242,106,.3)' : 'rgba(255,90,60,.15)'), borderRadius: 12, padding: '12px 8px', textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: libre! >= 0 ? 'var(--green-dk)' : 'var(--red)', fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase', marginBottom: 4 }}>Libre</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 18, fontWeight: 500, color: libre! >= 0 ? 'var(--green-dk)' : 'var(--red)' }}>${Math.abs(libre!).toFixed(0)}</div>
              <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 3 }}>{libre! >= 0 ? 'del presupuesto' : 'excedido'}</div>
            </div>
          ) : (
            <a href="/presupuesto?setup=true"
              style={{ background: 'var(--soft)', border: '1.5px dashed var(--border)', borderRadius: 12, padding: '12px 8px', textAlign: 'center', textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
              <div style={{ fontSize: 18 }}>📊</div>
              <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600, lineHeight: 1.3 }}>Configura presupuesto</div>
            </a>
          )}
        </div>

        {/* 2 — QUIEN PAGO QUE */}
        {current.byMember.length > 0 && (
          <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>Quien pago que</div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                Acuerdo: {members.map(m => m.name.split(' ')[0] + ' ' + m.defaultShare + '%').join(' · ')}
              </div>
            </div>
            {current.byMember.map((m: any, i: number) => {
              const memberDef = members.find(mb => mb.name === m.name || mb.name.split(' ')[0] === m.name.split(' ')[0])
              const acordado = memberDef ? (memberDef.defaultShare / 100) * totalSpent : 0
              const pctReal = totalSpent > 0 ? Math.round((m.paid / totalSpent) * 100) : 0
              const pctAcordado = memberDef?.defaultShare ?? 0
              const sobre = m.paid - acordado
              const c = avatarColors[i % avatarColors.length]
              const isOver = m.paid > acordado + 1
              return (
                <div key={i} style={{ padding: '12px 16px', borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <div style={{ width: 34, height: 34, borderRadius: '50%', background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: c.color, flexShrink: 0 }}>
                      {m.name[0]}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{m.name.split(' ')[0]}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 999, background: isOver ? 'rgba(255,90,60,.1)' : 'rgba(201,242,106,.12)', color: isOver ? 'var(--red)' : 'var(--green-dk)' }}>
                            {pctReal}% gastado
                          </span>
                          <span style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 500 }}>${m.paid.toFixed(0)}</span>
                        </div>
                      </div>
                      <div style={{ height: 5, background: 'var(--soft)', borderRadius: 999, overflow: 'hidden', marginBottom: 5 }}>
                        <div style={{ height: '100%', borderRadius: 999, background: isOver ? 'var(--red)' : 'var(--green-dk)', width: Math.min(pctReal, 100) + '%' }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 10, color: 'var(--muted)' }}>Acuerdo: {pctAcordado}% = ${acordado.toFixed(0)}</span>
                        <span style={{ fontSize: 10, fontWeight: 600, color: isOver ? 'var(--red)' : 'var(--green-dk)' }}>
                          {isOver ? '+' : ''}${sobre.toFixed(0)} {isOver ? 'sobre su parte' : 'por debajo'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* 3 — LIQUIDAR */}
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
              const fromIdx = members.findIndex(m => m.id === r.from)
              const toIdx = members.findIndex(m => m.id === r.to)
              const fromC = avatarColors[Math.max(fromIdx, 0) % avatarColors.length]
              const toC = avatarColors[Math.max(toIdx, 0) % avatarColors.length]
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
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
                  <button onClick={() => handleSettle(r)} disabled={!!isSettling}
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

        {/* 4 — METAS */}
        {goalsThisMonth.length > 0 && (
          <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>Metas</div>
              <a href="/metas" style={{ fontSize: 12, color: 'var(--muted)', textDecoration: 'none' }}>Ver todas</a>
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
                        ${goal.currentAmount.toFixed(0)} de ${goal.targetAmount.toFixed(0)} · {goal.pct}%
                        {goal.monthsLeft !== null && goal.monthsLeft > 0 && <span> · {goal.monthsLeft} meses</span>}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      {goal.monthAbonado > 0 ? (
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--green-dk)', background: 'rgba(201,242,106,.12)', padding: '3px 8px', borderRadius: 999, marginBottom: 4 }}>
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

        {/* 5 — GASTOS POR CATEGORIA */}
        <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>Gastos vs presupuesto</div>
          </div>
          {current.byCategory.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>Sin gastos este mes</div>
          ) : current.byCategory.map((cat: any, i: number) => {
            const budget = currentBudgets.find((b: any) => b.category?.name === cat.name)
            const pct = budget ? Math.min(Math.round((cat.total / budget.amount) * 100), 100) : 40
            const over = budget && cat.total > budget.amount
            const remaining = budget ? budget.amount - cat.total : null
            return (
              <div key={i} style={{ padding: '10px 16px', borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{ fontSize: 16 }}>{cat.icon}</span>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{cat.name}</span>
                    {over && <span style={{ fontSize: 10, background: 'rgba(255,90,60,.1)', color: 'var(--red)', borderRadius: 4, padding: '2px 6px', fontWeight: 700 }}>Excedido</span>}
                    {!budget && <span style={{ fontSize: 10, background: 'var(--soft)', color: 'var(--muted)', borderRadius: 4, padding: '2px 6px' }}>Sin limite</span>}
                  </div>
                  <div>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 500, color: over ? 'var(--red)' : 'var(--title)' }}>${cat.total.toFixed(0)}</span>
                    {budget && <span style={{ fontSize: 11, color: 'var(--muted)' }}> / ${budget.amount.toFixed(0)}</span>}
                  </div>
                </div>
                <div style={{ height: 4, background: 'var(--soft)', borderRadius: 999, overflow: 'hidden', marginBottom: 4 }}>
                  <div style={{ height: '100%', borderRadius: 999, background: over ? 'var(--red)' : (cat.color || 'var(--green-dk)'), width: pct + '%', transition: 'width .5s' }} />
                </div>
                {remaining !== null && (
                  <div style={{ fontSize: 10, color: over ? 'var(--red)' : 'var(--muted)', fontWeight: over ? 600 : 400 }}>
                    {over ? 'Excediste $' + Math.abs(remaining).toFixed(0) : 'Te quedan $' + remaining.toFixed(0)}
                  </div>
                )}
              </div>
            )
          })}
          {!hasBudget && (
            <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', background: 'rgba(55,138,221,.04)' }}>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>
                Sin presupuesto configurado — no puedes ver cuanto te queda por categoria.
              </div>
              <a href="/presupuesto?setup=true" style={{ fontSize: 12, fontWeight: 700, color: '#185fa5', textDecoration: 'none' }}>
                Configurar presupuesto →
              </a>
            </div>
          )}
        </div>

        {/* 6 — TENDENCIA */}
        <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 16, padding: '16px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>Tendencia de gasto</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16 }}>
            Cada barra muestra lo gastado y lo abonado a metas por mes
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 100, marginBottom: 8 }}>
            {[...data.monthlyData].reverse().map((m: MonthData, i: number) => {
              const gastoH = Math.max((m.total / maxTotal) * 85, 4)
              const monthGoalAbonado = goals.reduce((s, g) => {
                return s + g.contributions
                  .filter((c: any) => {
                    const d = new Date(c.createdAt)
                    return d.getMonth() + 1 === m.month && d.getFullYear() === m.year
                  })
                  .reduce((cs: number, c: any) => cs + c.amount, 0)
              }, 0)
              const metaH = Math.max((monthGoalAbonado / maxTotal) * 85, monthGoalAbonado > 0 ? 6 : 0)
              const isActive = i === data.monthlyData.length - 1 - activeMonth
              return (
                <div key={i} onClick={() => setActiveMonth(data.monthlyData.length - 1 - i)}
                  style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, cursor: 'pointer' }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 10, fontWeight: isActive ? 700 : 400, color: isActive ? 'var(--title)' : 'var(--muted)' }}>
                    ${m.total.toFixed(0)}
                  </div>
                  <div style={{ width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: 80 }}>
                    {metaH > 0 && (
                      <div style={{ width: '100%', height: metaH + 'px', background: '#378add', borderRadius: '3px 3px 0 0' }} />
                    )}
                    <div style={{ width: '100%', height: gastoH + 'px', background: isActive ? 'var(--title)' : 'var(--soft)', borderRadius: metaH > 0 ? 0 : '3px 3px 0 0', transition: 'all .4s' }} />
                  </div>
                  <div style={{ fontSize: 11, color: isActive ? 'var(--title)' : 'var(--muted)', fontWeight: isActive ? 700 : 400 }}>
                    {monthNamesShort[m.month - 1]}
                  </div>
                </div>
              )
            })}
          </div>
          <div style={{ display: 'flex', gap: 14, marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--title)' }} />
              <span style={{ fontSize: 11, color: 'var(--muted)' }}>Gastos</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: '#378add' }} />
              <span style={{ fontSize: 11, color: 'var(--muted)' }}>Metas abonadas</span>
            </div>
          </div>
          {data.monthlyData.length > 1 && (
            <div style={{ padding: '10px 12px', background: 'var(--soft)', borderRadius: 8, fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>
              {diff > 0
                ? <span>Gastaron <span style={{ color: 'var(--red)', fontWeight: 600 }}>${diff.toFixed(0)} mas</span> que el mes anterior.</span>
                : diff < 0
                ? <span>Gastaron <span style={{ color: 'var(--green-dk)', fontWeight: 600 }}>${Math.abs(diff).toFixed(0)} menos</span> que el mes anterior.</span>
                : <span>Gastos similares al mes anterior.</span>
              }
              {' '}Toca una barra para ver ese mes.
            </div>
          )}
        </div>

      </div>
    </div>
  )
}