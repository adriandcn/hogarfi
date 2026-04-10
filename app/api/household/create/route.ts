import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, members, goals = [], budgets = [] } = await req.json()

  const household = await prisma.household.create({
    data: { name },
  })

  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()

  for (let i = 0; i < members.length; i++) {
    const m = members[i]
    const member = await prisma.householdMember.create({
      data: {
        householdId: household.id,
        userId: i === 0 ? session.user.id : null,
        name: m.name,
        role: i === 0 ? 'ADMIN' : 'MEMBER',
        defaultShare: m.share,
        income: m.income ?? 0,
      },
    })

    if (i > 0) {
      await prisma.invitation.create({
        data: {
          householdId: household.id,
          invitedBy: session.user.id,
          memberId: member.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      })
    }
  }

  for (const goal of goals) {
    const months = goal.monthlyTarget > 0 ? Math.ceil(goal.targetAmount / goal.monthlyTarget) : null
    const deadline = months ? new Date(Date.now() + months * 30 * 24 * 60 * 60 * 1000) : null
    await prisma.goal.create({
      data: {
        householdId: household.id,
        name: goal.name,
        icon: goal.icon ?? '🎯',
        targetAmount: goal.targetAmount,
        monthlyTarget: goal.monthlyTarget,
        deadline,
      },
    })
  }

  for (const budget of budgets) {
    if (!budget.amount || budget.amount <= 0) continue
    let category = await prisma.category.findFirst({
      where: { householdId: household.id, name: budget.categoryName },
    })
    if (!category) {
      category = await prisma.category.create({
        data: { householdId: household.id, name: budget.categoryName, icon: budget.icon ?? '📦', color: budget.color ?? '#6b6b72' },
      })
    }
    await prisma.budget.create({
      data: { householdId: household.id, categoryId: category.id, amount: budget.amount, month, year },
    })
  }

  const res = NextResponse.json({ householdId: household.id })
  res.cookies.set('active_household', household.id, { httpOnly: false, maxAge: 60 * 60 * 24 * 365, path: '/' })
  return res
}