import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { amount, memberId, note } = await req.json()

  const contribution = await prisma.goalContribution.create({
    data: { goalId: id, memberId, amount, note },
  })

  await prisma.goal.update({
    where: { id },
    data: { currentAmount: { increment: amount } },
  })

  return NextResponse.json(contribution)
} 
