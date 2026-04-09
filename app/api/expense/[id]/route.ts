import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { description, amount, paidById, categoryName, icon, date, splits, householdId } = await req.json()

  let category = await prisma.category.findFirst({
    where: { householdId, name: categoryName },
  })
  if (!category) {
    category = await prisma.category.create({
      data: { householdId, name: categoryName, icon: icon ?? '📦' },
    })
  }

  await prisma.expenseSplit.deleteMany({ where: { expenseId: id } })

  const expense = await prisma.expense.update({
    where: { id },
    data: {
      description,
      amount,
      paidById,
      categoryId: category.id,
      createdAt: date ? new Date(date) : undefined,
      splits: {
        createMany: {
          data: splits.map((s: any) => ({
            memberId: s.memberId,
            percentage: s.percentage,
            amount: s.amount,
          })),
        },
      },
    },
  })

  return NextResponse.json(expense)
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await prisma.expenseSplit.deleteMany({ where: { expenseId: id } })
  await prisma.expense.delete({ where: { id } })

  return NextResponse.json({ ok: true })
} 
