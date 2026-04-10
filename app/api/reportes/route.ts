import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { getBalances, getSuggestedReimbursements } from '@/lib/balances'

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const cookieStore = await cookies()
  const activeHouseholdId = cookieStore.get('active_household')?.value

  const member = await prisma.householdMember.findFirst({
    where: {
      userId: session.user.id,
      ...(activeHouseholdId ? { householdId: activeHouseholdId } : {}),
    },
    include: { household: { include: { members: { include: { user: true } } } } },
  })
  if (!member) return NextResponse.json({ error: 'No household' }, { status: 404 })

  const householdId = member.householdId

  const allExpenses = await prisma.expense.findMany({
    where: { householdId },
    include: { category: true, splits: true },
    orderBy: { createdAt: 'desc' },
  })

  const monthSet = new Set<string>()
  for (const exp of allExpenses) {
    const d = new Date(exp.createdAt)
    monthSet.add(`${d.getFullYear()}-${d.getMonth() + 1}`)
  }

  const uniqueMonths = Array.from(monthSet)
    .map(key => {
      const [year, month] = key.split('-').map(Number)
      return { year, month }
    })
    .sort((a, b) => a.year !== b.year ? b.year - a.year : b.month - a.month)
    .slice(0, 3)

  if (uniqueMonths.length === 0) {
    const now = new Date()
    for (let i = 0; i < 3; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      uniqueMonths.push({ month: d.getMonth() + 1, year: d.getFullYear() })
    }
  }

  const monthlyData = await Promise.all(uniqueMonths.map(async ({ month, year }) => {
    const start = new Date(year, month - 1, 1)
    const end = new Date(year, month, 0, 23, 59, 59)

    const expenses = allExpenses.filter(e => {
      const d = new Date(e.createdAt)
      return d >= start && d <= end
    })

    const total = expenses.reduce((s, e) => s + e.amount, 0)

    const byCategory: Record<string, { name: string; icon: string; color: string; total: number }> = {}
    for (const exp of expenses) {
      const key = exp.category?.name ?? 'Sin categoria'
      if (!byCategory[key]) {
        byCategory[key] = { name: key, icon: exp.category?.icon ?? '📦', color: exp.category?.color ?? '#6b6b72', total: 0 }
      }
      byCategory[key].total += exp.amount
    }

    const byMember: Record<string, { name: string; paid: number }> = {}
    for (const exp of expenses) {
      const m = member.household.members.find(m => m.id === exp.paidById)
      const name = m?.name ?? m?.user?.name ?? 'Desconocido'
      if (!byMember[exp.paidById]) byMember[exp.paidById] = { name, paid: 0 }
      byMember[exp.paidById].paid += exp.amount
    }

    return {
      month, year, total, count: expenses.length,
      byCategory: Object.values(byCategory).sort((a, b) => b.total - a.total),
      byMember: Object.values(byMember).sort((a, b) => b.paid - a.paid),
    }
  }))

  const latestMonth = uniqueMonths[0]
  const budgets = await prisma.budget.findMany({
    where: { householdId, month: latestMonth.month, year: latestMonth.year },
    include: { category: true },
  })

  const goals = await prisma.goal.findMany({
    where: { householdId },
    include: { contributions: { orderBy: { createdAt: 'desc' } } },
  })

  // Balances y reimbursements
  const balances = getBalances(allExpenses as any)
  const rawReimbursements = getSuggestedReimbursements(balances)
  const reimbursements = rawReimbursements.map(r => {
    const from = member.household.members.find(m => m.id === r.from)
    const to = member.household.members.find(m => m.id === r.to)
    return {
      from: r.from,
      to: r.to,
      amount: r.amount,
      fromName: (from?.name ?? from?.user?.name ?? '?').split(' ')[0],
      toName: (to?.name ?? to?.user?.name ?? '?').split(' ')[0],
    }
  })

  const balancesForClient: Record<string, { paid: number; total: number }> = {}
  for (const [id, bal] of Object.entries(balances)) {
    balancesForClient[id] = { paid: bal.paid, total: bal.total }
  }

  return NextResponse.json({
    monthlyData,
    budgets,
    members: member.household.members.map(m => ({
      id: m.id,
      name: m.name ?? m.user?.name ?? 'Sin nombre',
      defaultShare: m.defaultShare,
    })),
    goals,
    reimbursements,
    balances: balancesForClient,
    myMemberId: member.id,
    householdId,
  })
}