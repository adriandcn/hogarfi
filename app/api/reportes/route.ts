import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

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
    include: { household: { include: { members: true } } },
  })
  if (!member) return NextResponse.json({ error: 'No household' }, { status: 404 })

  const householdId = member.householdId
  const now = new Date()

  const months = [0, 1, 2].map(i => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    return { month: d.getMonth() + 1, year: d.getFullYear() }
  })

  const monthlyData = await Promise.all(months.map(async ({ month, year }) => {
    const start = new Date(year, month - 1, 1)
    const end = new Date(year, month, 0, 23, 59, 59)

    const expenses = await prisma.expense.findMany({
      where: { householdId, createdAt: { gte: start, lte: end } },
      include: { category: true, splits: true },
    })

    const total = expenses.reduce((s, e) => s + e.amount, 0)

    const byCategory: Record<string, { name: string; icon: string; color: string; total: number }> = {}
    for (const exp of expenses) {
      const key = exp.category?.name ?? 'Sin categoria'
      if (!byCategory[key]) {
        byCategory[key] = {
          name: key,
          icon: exp.category?.icon ?? '📦',
          color: exp.category?.color ?? '#6b6b72',
          total: 0,
        }
      }
      byCategory[key].total += exp.amount
    }

    const byMember: Record<string, { name: string; paid: number }> = {}
    for (const exp of expenses) {
      const m = member.household.members.find(m => m.id === exp.paidById)
      const name = m?.name ?? 'Desconocido'
      if (!byMember[exp.paidById]) {
        byMember[exp.paidById] = { name, paid: 0 }
      }
      byMember[exp.paidById].paid += exp.amount
    }

    return {
      month,
      year,
      total,
      count: expenses.length,
      byCategory: Object.values(byCategory).sort((a, b) => b.total - a.total),
      byMember: Object.values(byMember).sort((a, b) => b.paid - a.paid),
    }
  }))

  const budgets = await prisma.budget.findMany({
    where: { householdId, month: months[0].month, year: months[0].year },
    include: { category: true },
  })

  const goals = await prisma.goal.findMany({
  where: { householdId },
  include: {
    contributions: {
      orderBy: { createdAt: 'desc' },
    },
  },
})

return NextResponse.json({ monthlyData, budgets, members: member.household.members, goals })

  
}