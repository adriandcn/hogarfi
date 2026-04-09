import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getBalances, getSuggestedReimbursements } from '@/lib/balances'

export default async function GastosPage() {
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
            include: {
              splits: { include: { member: { include: { user: true } } } },
              category: true,
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      },
    },
  })

  if (!member) redirect('/onboarding')

  const household = member.household
  const expenses = household.expenses
  const members = household.members
  const myMemberId = member.id

  const balances = getBalances(expenses as any)
  const reimbursements = getSuggestedReimbursements(balances)
  const myNet = balances[myMemberId]?.total ?? 0

  return (
    <div style={{ minHeight: '100vh', background: 'var(--off)', paddingBottom: 100 }}>

      <div style={{ background: 'var(--title)', padding: '52px 20px 20px' }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: '#fff', letterSpacing: '-.02em', marginBottom: 16 }}>
          Gastos del hogar
        </div>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
          {members.map(m => {
            const total = balances[m.id]?.total ?? 0
            const name = (m.name ?? m.user?.name ?? '?').split(' ')[0]
            return (
              <div key={m.id} style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 999, padding: '6px 12px 6px 8px' }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'var(--title)' }}>
                  {name[0]}
                </div>
                <span style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,.8)' }}>{name}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: total >= 0 ? 'var(--green)' : '#ff8a70' }}>
                  {total >= 0 ? '+' : ''}${Math.abs(total).toFixed(0)}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {myNet !== 0 && (
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
                    }).join(' · ') || 'Sin deudas pendientes'
                  : reimbursements.filter(r => r.from === myMemberId).map(r => {
                      const to = members.find(m => m.id === r.to)
                      return 'Debes $' + r.amount.toFixed(0) + ' a ' + (to?.name ?? to?.user?.name ?? '?').split(' ')[0]
                    }).join(' · ') || 'Sin deudas pendientes'
                }
              </div>
            </div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 22, fontWeight: 500, color: myNet > 0 ? 'var(--green-dk)' : 'var(--red)', flexShrink: 0 }}>
              {myNet > 0 ? '+' : ''}${myNet.toFixed(0)}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>
            {expenses.length} gasto{expenses.length !== 1 ? 's' : ''}
          </div>
          <a href="/gastos/nuevo" style={{ background: 'var(--title)', color: '#fff', borderRadius: 999, padding: '7px 16px', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
            + Agregar
          </a>
        </div>

        {expenses.length === 0 ? (
          <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 16, padding: '40px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>💳</div>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Sin gastos aun</div>
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>Agrega tu primer gasto del hogar</div>
          </div>
        ) : (
          <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
            {expenses.map((exp, i) => {
              const payer = members.find(m => m.id === exp.paidById)
              const payerName = (payer?.name ?? payer?.user?.name ?? '?').split(' ')[0]
              return (
                <a key={exp.id} href={'/gastos/' + exp.id + '/editar'}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderTop: i > 0 ? '1px solid var(--border)' : 'none', textDecoration: 'none', color: 'inherit' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                    {exp.category?.icon ?? '💳'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {exp.description}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span>{payerName} pago</span>
                      <span style={{ color: 'var(--border)' }}>·</span>
                      <span style={{ display: 'flex', gap: 4 }}>
                        {exp.splits.map(s => {
                          const sm = members.find(m => m.id === s.memberId)
                          const sName = (sm?.name ?? sm?.user?.name ?? '?').split(' ')[0]
                          return (
                            <span key={s.memberId} style={{ background: 'var(--soft)', borderRadius: 4, padding: '1px 5px', fontSize: 11, fontWeight: 600 }}>
                              {sName} {s.percentage}%
                            </span>
                          )
                        })}
                      </span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 15, fontWeight: 500 }}>
                      ${exp.amount.toFixed(2)}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                      {new Date(exp.createdAt).toLocaleDateString('es', { day: 'numeric', month: 'short' })}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3 }}>→</div>
                  </div>
                </a>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}