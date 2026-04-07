import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { getBalances, getSuggestedReimbursements } from '@/lib/balances'

export default async function DashboardPage() {
  // Obtener sesión
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) redirect('/login')

  // Buscar hogar del usuario
  const member = await prisma.householdMember.findFirst({
    where: { userId: session.user.id },
    include: {
      household: {
        include: {
          members: { include: { user: true } },
          expenses: {
            include: { splits: true, category: true },
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
          budgets: { include: { category: true } },
        },
      },
    },
  })

  // Si no tiene hogar, redirigir a crear uno
  if (!member) redirect('/onboarding')

  const household = member.household
  const expenses = household.expenses
  const members = household.members

  const balances = getBalances(expenses as any)
  const reimbursements = getSuggestedReimbursements(balances)

  const totalSpent = household.budgets.reduce((s, b) => s + b.amount, 0)
  const totalBudget = household.budgets.reduce((s, b) => s + b.amount, 0)
  const remaining = totalBudget - totalSpent
  const pct = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', maxWidth: 430, margin: '0 auto' }}>
      <div style={{ background: 'var(--ink)', padding: '28px 20px 24px' }}>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,.45)', letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 20 }}>
          {new Date().toLocaleString('es', { month: 'long', year: 'numeric' })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,.5)', marginBottom: 4 }}>
              {household.name}
            </div>
            <div style={{ fontFamily: 'var(--font-syne)', fontSize: 46, fontWeight: 800, color: '#fff', letterSpacing: '-.04em', lineHeight: 1 }}>
              <span style={{ fontSize: 20, opacity: .6 }}>$</span>{remaining.toFixed(0)}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,.45)', marginTop: 4 }}>
              presupuesto restante
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'var(--font-syne)', fontSize: 28, fontWeight: 800, color: '#b8f04a' }}>
              {expenses.length}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,.45)' }}>gastos este mes</div>
          </div>
        </div>

        {/* Members */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {members.map(m => (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 99, padding: '6px 12px 6px 6px' }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#b8f04a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#1a1814' }}>
                {m.user.name?.[0] ?? '?'}
              </div>
              <span style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,.8)' }}>{m.user.name}</span>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,.4)' }}>{m.defaultShare}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Sin datos aún */}
      {expenses.length === 0 && (
        <div style={{ padding: '40px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🏠</div>
          <div style={{ fontFamily: 'var(--font-syne)', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
            Bienvenido a {household.name}
          </div>
          <div style={{ fontSize: 14, color: 'var(--ink3)', marginBottom: 24 }}>
            Agrega tu primer gasto para empezar
          </div>
          <a href="/gastos/nuevo" style={{ background: 'var(--ink)', color: '#fff', borderRadius: 12, padding: '14px 24px', fontSize: 15, fontWeight: 600, textDecoration: 'none', fontFamily: 'var(--font-syne)' }}>
            + Agregar primer gasto
          </a>
        </div>
      )}

      {/* Gastos recientes */}
      {expenses.length > 0 && (
        <div style={{ padding: '16px 20px', paddingBottom: 100 }}>
          <div style={{ fontFamily: 'var(--font-syne)', fontSize: 13, fontWeight: 700, marginBottom: 12 }}>
            Últimos gastos
          </div>
          <div style={{ borderRadius: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {expenses.map((exp, i) => (
              <div key={exp.id} style={{ background: 'var(--surface)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                  {exp.category?.icon ?? '💳'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{exp.description}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink3)' }}>
                    {new Date(exp.createdAt).toLocaleDateString('es')}
                  </div>
                </div>
                <div style={{ fontFamily: 'var(--font-syne)', fontSize: 15, fontWeight: 700 }}>
                  ${exp.amount.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}