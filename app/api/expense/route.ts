import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { householdId, paidById, description, amount, categoryName, icon, splits } = await req.json()

  if (!householdId || !paidById || !description || !amount) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const member = await prisma.householdMember.findFirst({
    where: { householdId, userId: session.user.id },
  })
  if (!member) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  // Obtener o crear categoría
  let category = null
  if (categoryName) {
    category = await prisma.category.findFirst({
      where: { householdId, name: categoryName },
    })
    if (!category) {
      category = await prisma.category.create({
        data: { householdId, name: categoryName, icon: icon ?? '📦' },
      })
    }
  }

  const expense = await prisma.expense.create({
    data: {
      householdId,
      paidById,
      description,
      amount,
      categoryId: category?.id,
      useDefaultShares: true,
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
    include: {
      splits: { include: { member: true } },
      category: true,
    },
  })

  return NextResponse.json(expense)
}