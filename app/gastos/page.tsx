import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getBalances, getSuggestedReimbursements } from '@/lib/balances'

export default async function GastosPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/login')

  const member = await prisma.householdMember.findFirst({
    where: { userId: session.user.id },
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

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', maxWidth: 430, margin: '0 auto' }}>

      {/* HEADER */}
      <div style={{ background: 'var(--ink)', padding: '24px 20px 20px' }}>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,.45)', letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 6 }}>
          {household.name}
        </div>
        <div style={{ fontFamily: 'var(--font-syne)', fontSize: 24, fontWeight: 800, color: '#fff', marginBottom: 16 }}>
          Gastos del hogar
        </div>

        {/* Balance chips */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
          {members.map(m => {
            const bal = balances[m.id]
            const total = bal?.total ?? 0
            return (
              <div key={m.id} style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 99, padding: '7px 14px 7px 8px' }}>
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#b8f04a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#1a1814' }}>
                  {m.user.name?.[0] ?? '?'}
                </div>
                <span style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,.8)' }}>
                  {m.user.name?.split(' ')[0]}
                </span>
                <span style={{ fontSize: 12, fontWeight: 700, color: total >= 0 ? '#b8f04a' : '#ff6b4a' }}>
                  {total >= 0 ? '+' : ''}${Math.abs(total).toFixed(0)}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* LIQUIDAR SUGGESTION */}
      {reimbursements.length > 0 && (
        <div style={{ margin: '14px 20px 0', background: 'rgba(255,107,74,.06)', border: '1px solid rgba(255,107,74,.2)', borderRadius: 12, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--coral)', marginBottom: 2 }}>
              {reimbursements.length} transferencia{reimbursements.length > 1 ? 's' : ''} pendiente{reimbursements.length > 1 ? 's' : ''}
            </div>
            <div style={{ fontSize: 11, color: 'var(--ink3)' }}>
              {reimbursements.map(r => {
                const from = members.find(m => m.id === r.from)
                const to = members.find(m => m.id === r.to)
                return `${from?.user.name?.split(' ')[0]} → ${to?.user.name?.split(' ')[0]} $${r.amount.toFixed(0)}`
              }).join(' · ')}
            </div>
          </div>
          <a href="/liquidar" style={{ fontSize: 12, fontWeight: 700, color: 'var(--coral)', textDecoration: 'none', flexShrink: 0, marginLeft: 12 }}>
            Ver →
          </a>
        </div>
      )}

      {/* LISTA */}
      <div style={{ padding: '16px 20px', paddingBottom: 100 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontFamily: 'var(--font-syne)', fontSize: 13, fontWeight: 700 }}>
            {expenses.length} gasto{expenses.length !== 1 ? 's' : ''}
          </div>
          <a href="/gastos/nuevo" style={{ background: 'var(--ink)', color: '#fff', borderRadius: 99, padding: '6px 14px', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
            + Agregar
          </a>
        </div>

        {expenses.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>💳</div>
            <div style={{ fontFamily: 'var(--font-syne)', fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Sin gastos aún</div>
            <div style={{ fontSize: 13, color: 'var(--ink3)' }}>Agrega tu primer gasto del hogar</div>
          </div>
        ) : (
          <div style={{ borderRadius: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {expenses.map((exp, i) => {
              const payer = members.find(m => m.id === exp.paidById)
              const mySplit = exp.splits.find(s => s.memberId === myMemberId)
              const iOwe = exp.paidById !== myMemberId && mySplit && mySplit.amount > 0
              const iAmOwed = exp.paidById === myMemberId

              return (
                <div key={exp.id} style={{ background: 'var(--surface)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, borderTop: i > 0 ? '1px solid var(--border)' : 'none', borderRadius: i === 0 ? '14px 14px 0 0' : i === expenses.length - 1 ? '0 0 14px 14px' : 0 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                    {exp.category?.icon ?? '💳'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {exp.description}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--ink3)', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ width: 16, height: 16, borderRadius: '50%', background: '#b8f04a', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#1a1814' }}>
                        {payer?.user.name?.[0] ?? '?'}
                      </span>
                      {payer?.user.name?.split(' ')[0]} pagó · {new Date(exp.createdAt).toLocaleDateString('es', { day: 'numeric', month: 'short' })}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontFamily: 'var(--font-syne)', fontSize: 15, fontWeight: 700 }}>
                      ${exp.amount.toFixed(2)}
                    </div>
                    {mySplit && (
                      <div style={{ fontSize: 11, marginTop: 2, fontWeight: 600, color: iOwe ? 'var(--coral)' : iAmOwed ? 'var(--lime-dk)' : 'var(--ink3)' }}>
                        {iOwe ? `debes $${mySplit.amount.toFixed(2)}` : iAmOwed ? `te deben $${(exp.amount - mySplit.amount).toFixed(2)}` : 'pagado'}
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