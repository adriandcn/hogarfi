import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getBalances, getSuggestedReimbursements } from '@/lib/balances'
import { cookies } from 'next/headers'
export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/login')

 const cookieStore = await cookies()
const activeHouseholdId = cookieStore.get('active_household')?.value

const member = await prisma.householdMember.findFirst({
  where: {
    userId: session.user.id,
    ...(activeHouseholdId ? { householdId: activeHouseholdId } : {}),
  },
    include: {
      household: {
        include: {
          members: { include: { user: true } },
          expenses: {
            include: { splits: true, category: true },
            orderBy: { createdAt: 'desc' },
          },
          budgets: { include: { category: true } },
        },
      },
    },
  })

  if (!member) redirect('/onboarding')

  const household = member.household
  const members = household.members
  const expenses = household.expenses
  const myMemberId = member.id

  const now = new Date()
  const month = now.getMonth()
  const year = now.getFullYear()
  const monthExpenses = expenses.filter(e => {
    const d = new Date(e.createdAt)
    return d.getMonth() === month && d.getFullYear() === year
  })

  const balances = getBalances(expenses as any)
  const reimbursements = getSuggestedReimbursements(balances)
  const myNet = balances[myMemberId]?.total ?? 0
  const totalSpent = monthExpenses.reduce((s, e) => s + e.amount, 0)

  const budgetByCategory: Record<string, number> = {}
  for (const b of household.budgets) {
    if (b.month === month + 1 && b.year === year) {
      budgetByCategory[b.categoryId] = b.amount
    }
  }
  const totalBudget = Object.values(budgetByCategory).reduce((s, v) => s + v, 0)
  const budgetRemaining = totalBudget - totalSpent
  const budgetPct = totalBudget > 0 ? Math.min(Math.round((totalSpent / totalBudget) * 100), 100) : 0

  const monthNames = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
  const myName = (member.name ?? session.user.name ?? 'tu').split(' ')[0]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--off)', paddingBottom: 90 }}>

      <div style={{ padding: '52px 20px 20px' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 500, marginBottom: 4 }}>
              {household.name} · {monthNames[month]} {year}
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-.02em', lineHeight: 1.2 }}>
              Hola, {myName}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <a href="/invitar" style={{ width: 42, height: 42, borderRadius: '50%', background: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, textDecoration: 'none' }}>
              👥
            </a>
            <a href="/configuracion" style={{ width: 42, height: 42, borderRadius: '50%', background: 'var(--soft)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, textDecoration: 'none' }}>
              ⚙️
            </a>
          </div>
        </div>

        <div style={{ background: 'var(--title)', borderRadius: 20, padding: '20px', marginBottom: 12 }}>
          {totalBudget > 0 ? (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.4)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 8 }}>
                Presupuesto restante
              </div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 44, fontWeight: 500, color: '#fff', letterSpacing: '-.02em', lineHeight: 1, marginBottom: 8 }}>
                ${budgetRemaining.toFixed(0)}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,.4)' }}>
                  de ${totalBudget.toFixed(0)} · {budgetPct}% usado
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, padding: '3px 10px', background: budgetPct > 90 ? 'rgba(255,90,60,.2)' : 'rgba(201,242,106,.15)', color: budgetPct > 90 ? '#ff8a70' : 'var(--green)', borderRadius: 999 }}>
                  {budgetPct > 90 ? 'Cerca del limite' : 'Al dia'}
                </div>
              </div>
              <div style={{ height: 4, background: 'rgba(255,255,255,.08)', borderRadius: 999, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: budgetPct > 90 ? 'var(--red)' : 'var(--green)', borderRadius: 999, width: budgetPct + '%' }} />
              </div>
            </div>
         ) : (
  <div>
    <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.4)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 8 }}>
      Gastado este mes
    </div>
    <div style={{ fontFamily: 'var(--mono)', fontSize: 44, fontWeight: 500, color: '#fff', letterSpacing: '-.02em', lineHeight: 1, marginBottom: 16 }}>
      ${totalSpent.toFixed(0)}
    </div>
    <a href="/presupuesto?setup=true" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(201,242,106,.12)', border: '1px solid rgba(201,242,106,.25)', borderRadius: 12, padding: '12px 14px', textDecoration: 'none' }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--green)', marginBottom: 2 }}>
          Configura tu presupuesto
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,.45)', lineHeight: 1.4 }}>
          Define metas mensuales y recibe alertas cuando te acerques al limite
        </div>
      </div>
      <div style={{ fontSize: 20, marginLeft: 12, flexShrink: 0 }}>→</div>
    </a>
  </div>
)}
        </div>

        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
          {members.map(m => {
            const total = balances[m.id]?.total ?? 0
            const name = (m.name ?? m.user?.name ?? '?').split(' ')[0]
            return (
              <div key={m.id} style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6, background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 999, padding: '6px 12px 6px 8px' }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'var(--title)' }}>
                  {name[0]}
                </div>
                <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--body)' }}>{name}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: total >= 0 ? 'var(--green-dk)' : 'var(--red)' }}>
                  {total >= 0 ? '+' : ''}${Math.abs(total).toFixed(0)}
                </span>
              </div>
            )
          })}
        </div>

      </div>

      {myNet !== 0 && (
        <div style={{ margin: '0 20px 16px' }}>
          <div style={{ background: myNet > 0 ? 'rgba(201,242,106,.1)' : 'rgba(255,90,60,.05)', border: '1px solid ' + (myNet > 0 ? 'rgba(201,242,106,.3)' : 'rgba(255,90,60,.2)'), borderRadius: 14, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: myNet > 0 ? 'var(--green-dk)' : 'var(--red)', marginBottom: 2, letterSpacing: '.04em', textTransform: 'uppercase' }}>
                Tu balance
              </div>
              <div style={{ fontSize: 13, color: 'var(--muted)' }}>
                {myNet > 0
                  ? reimbursements.filter(r => r.to === myMemberId).map(r => {
                      const from = members.find(m => m.id === r.from)
                      return (from?.name ?? from?.user?.name ?? '?').split(' ')[0] + ' te debe $' + r.amount.toFixed(0)
                    }).join(' · ') || 'Sin transferencias pendientes'
                  : reimbursements.filter(r => r.from === myMemberId).map(r => {
                      const to = members.find(m => m.id === r.to)
                      return 'Debes $' + r.amount.toFixed(0) + ' a ' + (to?.name ?? to?.user?.name ?? '?').split(' ')[0]
                    }).join(' · ') || 'Sin transferencias pendientes'
                }
              </div>
            </div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 22, fontWeight: 500, color: myNet > 0 ? 'var(--green-dk)' : 'var(--red)', flexShrink: 0 }}>
              {myNet > 0 ? '+' : ''}${myNet.toFixed(0)}
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, margin: '0 20px 16px' }}>
        <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px 16px' }}>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>Gastado</div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 24, fontWeight: 500, color: 'var(--red)' }}>${totalSpent.toFixed(0)}</div>
        </div>
        <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px 16px' }}>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>Gastos</div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 24, fontWeight: 500 }}>{monthExpenses.length}</div>
        </div>
      </div>

      <div style={{ padding: '0 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>Ultimos gastos</div>
          <a href="/gastos" style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 500, textDecoration: 'none' }}>Ver todos</a>
        </div>

        {expenses.length === 0 ? (
          <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 16, padding: '32px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>💳</div>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Sin gastos aun</div>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>Agrega tu primer gasto del hogar</div>
            <a href="/gastos/nuevo" style={{ display: 'inline-block', background: 'var(--title)', color: '#fff', borderRadius: 999, padding: '10px 20px', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
              + Agregar gasto
            </a>
          </div>
        ) : (
          <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
            {expenses.slice(0, 4).map((exp, i) => {
              const payer = members.find(m => m.id === exp.paidById)
              const payerName = (payer?.name ?? payer?.user?.name ?? '?').split(' ')[0]
              const mySplit = exp.splits.find(s => s.memberId === myMemberId)
              const iOwe = exp.paidById !== myMemberId && mySplit && mySplit.amount > 0
              const iAmOwed = exp.paidById === myMemberId && mySplit && exp.amount > mySplit.amount
              return (
                <div key={exp.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                    {exp.category?.icon ?? '💳'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {exp.description}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                      {payerName} pago · {new Date(exp.createdAt).toLocaleDateString('es', { day: 'numeric', month: 'short' })}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 15, fontWeight: 500 }}>
                      ${exp.amount.toFixed(0)}
                    </div>
                    {mySplit && (
                      <div style={{ fontSize: 11, fontWeight: 600, color: iOwe ? 'var(--red)' : iAmOwed ? 'var(--green-dk)' : 'var(--muted)' }}>
                        {iOwe ? 'debes $' + mySplit.amount.toFixed(0) : iAmOwed ? 'te deben $' + (exp.amount - mySplit.amount).toFixed(0) : 'pagado'}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

    </div>
  )
}