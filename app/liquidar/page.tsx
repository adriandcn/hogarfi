import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getBalances, getSuggestedReimbursements } from '@/lib/balances'
import SettleButton from './settle-button'

export default async function LiquidarPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/login')

  const member = await prisma.householdMember.findFirst({
    where: { userId: session.user.id },
    include: {
      household: {
        include: {
          members: { include: { user: true } },
          expenses: { include: { splits: true } },
        },
      },
    },
  })

  if (!member) redirect('/onboarding')

  const household = member.household
  const members = household.members
  const expenses = household.expenses

  const balances = getBalances(expenses as any)
  const reimbursements = getSuggestedReimbursements(balances)
  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0)

  const colors = [
    { bg: '#c9f26a', color: '#1a1814' },
    { bg: '#dbeafe', color: '#1e40af' },
    { bg: '#fef3c7', color: '#92400e' },
    { bg: '#ede9fe', color: '#5b21b6' },
  ]

  function getMemberColor(id: string) {
    const i = members.findIndex(m => m.id === id)
    return colors[i % colors.length]
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--off)', paddingBottom: 100 }}>

      {/* HEADER */}
      <div style={{ background: 'var(--title)', padding: '52px 20px 20px' }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: '#fff', letterSpacing: '-.02em', marginBottom: 4 }}>
          Liquidar cuentas
        </div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,.4)' }}>
          {reimbursements.length === 0
            ? 'Todos en cero'
            : reimbursements.length + ' transferencia' + (reimbursements.length !== 1 ? 's' : '') + ' pendiente' + (reimbursements.length !== 1 ? 's' : '')}
        </div>
      </div>

      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* SIN DEUDAS */}
        {reimbursements.length === 0 && (
          <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 16, padding: '40px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
            <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>Todo en orden</div>
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>No hay transferencias pendientes</div>
          </div>
        )}

        {/* TRANSFERENCIAS */}
        {reimbursements.map((r, i) => {
          const from = members.find(m => m.id === r.from)
          const to = members.find(m => m.id === r.to)
          const fromName = (from?.name ?? from?.user?.name ?? '?').split(' ')[0]
          const toName = (to?.name ?? to?.user?.name ?? '?').split(' ')[0]
          const fromColor = getMemberColor(r.from)
          const toColor = getMemberColor(r.to)

          return (
            <div key={i} style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 16, padding: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: fromColor.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 700, color: fromColor.color, flexShrink: 0 }}>
                  {fromName[0]}
                </div>
                <div style={{ fontSize: 18, color: 'var(--muted)' }}>→</div>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: toColor.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 700, color: toColor.color, flexShrink: 0 }}>
                  {toName[0]}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 2 }}>{fromName} paga a {toName}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>Saldo acumulado del mes</div>
                </div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 24, fontWeight: 500, color: 'var(--red)', flexShrink: 0 }}>
                  ${r.amount.toFixed(0)}
                </div>
              </div>
              <SettleButton
                fromMemberId={r.from}
                toMemberId={r.to}
                amount={r.amount}
                householdId={household.id}
                label={'Marcar ' + fromName + ' pagado'}
              />
            </div>
          )
        })}

        {/* RESUMEN */}
        {totalSpent > 0 && (
          <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', background: 'var(--soft)', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: '.08em', textTransform: 'uppercase' }}>
                Resumen del hogar
              </div>
            </div>
            {members.map((m, i) => {
              const bal = balances[m.id]
              const name = (m.name ?? m.user?.name ?? '?').split(' ')[0]
              const c = colors[i % colors.length]
              const diff = bal?.total ?? 0

              return (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: c.color, flexShrink: 0 }}>
                    {name[0]}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{name}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>{m.defaultShare}% del hogar</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 500 }}>
                      ${(bal?.paid ?? 0).toFixed(0)} pagado
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: diff >= 0 ? 'var(--green-dk)' : 'var(--red)' }}>
                      {diff >= 0 ? '+' : ''}${diff.toFixed(0)} {diff >= 0 ? 'a favor' : 'debe'}
                    </div>
                  </div>
                </div>
              )
            })}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '13px 16px', borderTop: '1px solid var(--border)', background: 'rgba(201,242,106,.06)' }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>Total gastado</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 15, fontWeight: 500 }}>${totalSpent.toFixed(0)}</div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}