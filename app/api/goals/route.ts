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
  })
  if (!member) return NextResponse.json({ error: 'No household' }, { status: 404 })

  const goals = await prisma.goal.findMany({
    where: { householdId: member.householdId },
    include: {
      contributions: {
        include: { member: true },
        orderBy: { createdAt: 'desc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ goals, myMemberId: member.id })
}

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const cookieStore = await cookies()
  const activeHouseholdId = cookieStore.get('active_household')?.value

  const member = await prisma.householdMember.findFirst({
    where: {
      userId: session.user.id,
      ...(activeHouseholdId ? { householdId: activeHouseholdId } : {}),
    },
  })
  if (!member) return NextResponse.json({ error: 'No household' }, { status: 404 })

  const { name, icon, targetAmount, monthlyTarget } = await req.json()

  const months = monthlyTarget > 0 ? Math.ceil(targetAmount / monthlyTarget) : null
  const deadline = months ? new Date(Date.now() + months * 30 * 24 * 60 * 60 * 1000) : null

  const goal = await prisma.goal.create({
    data: {
      householdId: member.householdId,
      name,
      icon: icon ?? '🎯',
      targetAmount,
      monthlyTarget,
      deadline,
    },
    include: {
      contributions: {
        include: { member: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  return NextResponse.json(goal)
}