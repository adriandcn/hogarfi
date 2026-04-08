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
          expenses: {
            include: { splits: true },
          },
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

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', maxWidth: 430, margin: '0 auto' }}>

      <div style={{ background: 'var(--ink)', padding: '24px 20px 20px' }}>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,.45)', letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 6 }}>
          {household.name}
        </div>
        <div style={{ fontFamily: 'var(--font-syne)', fontSize: 24, fontWeight: 800, color: '#fff', marginBottom: 4 }}>
          Liquidar cuentas
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,.45)' }}>
          {reimbursements.length === 0
            ? 'Todos en cero'
            : `${reimbursements.length} transferencia${reimbursements.length !== 1 ? 's' : ''} pendiente${reimbursements.length !== 1 ? 's' : ''}`}
        </div>
      </div>

      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 100 }}>

        {reimbursements.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <div style={{ fontFamily: 'var(--font-syne)', fontSize: 18, fontWeight: 700 }}>Todo en orden</div>
            <div style={{ fontSize: 13, color: 'var(--ink3)', marginTop: 8 }}>No hay deudas pendientes</div>
          </div>
        )}

        {reimbursements.map((r, i) => {
          const from = members.find(m => m.id === r.from)
          const to = members.find(m => m.id === r.to)
          const fromName = (from?.name ?? from?.user?.name ?? 'Miembro').split(' ')[0]
          const toName = (to?.name ?? to?.user?.name ?? 'Miembro').split(' ')[0]
          return (
            <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#b8f04a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, color: '#1a1814' }}>
                    {fromName[0]}
                  </div>
                  <span style={{ fontSize: 16, color: 'var(--ink3)' }}>→</span>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#4a9eff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, color: '#fff' }}>
                    {toName[0]}
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{fromName} → {toName}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink3)' }}>Saldo pendiente</div>
                </div>
                <div style={{ fontFamily: 'var(--font-syne)', fontSize: 22, fontWeight: 800, color: 'var(--coral)' }}>
                  ${r.amount.toFixed(2)}
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

        {totalSpent > 0 && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ background: 'var(--surface2)', padding: '12px 16px', fontSize: 11, fontWeight: 700, color: 'var(--ink3)', letterSpacing: '.08em', textTransform: 'uppercase' }}>
              Resumen del hogar
            </div>
            {members.map((m, i) => {
              const bal = balances[m.id]
              const name = (m.name ?? m.user?.name ?? 'Miembro').split(' ')[0]
              const corresponds = totalSpent * m.defaultShare / 100
              const diff = (bal?.paid ?? 0) - corresponds
              return (
                <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 16px', borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#b8f04a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#1a1814' }}>
                      {name[0]}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{name}</div>
                      <div style={{ fontSize: 11, color: 'var(--ink3)' }}>{m.defaultShare}%</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'var(--font-syne)', fontSize: 14, fontWeight: 700 }}>
                      ${(bal?.paid ?? 0).toFixed(2)} pagado
                    </div>
                    <div style={{ fontSize: 11, color: diff >= 0 ? 'var(--lime-dk)' : 'var(--coral)', fontWeight: 600 }}>
                      {diff >= 0 ? `+$${diff.toFixed(2)} a favor` : `-$${Math.abs(diff).toFixed(2)} debe`}
                    </div>
                  </div>
                </div>
              )
            })}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '13px 16px', borderTop: '1px solid var(--border)', background: 'rgba(184,240,74,.06)' }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>Total gastado</div>
              <div style={{ fontFamily: 'var(--font-syne)', fontSize: 15, fontWeight: 800 }}>${totalSpent.toFixed(2)}</div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}