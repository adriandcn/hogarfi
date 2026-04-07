 import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const member = await prisma.householdMember.findFirst({
    where: { userId: session.user.id },
  })
  if (!member) return NextResponse.json({ error: 'No household' }, { status: 404 })

  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()

  // Obtener presupuestos del mes actual
  const budgets = await prisma.budget.findMany({
    where: { householdId: member.householdId, month, year },
    include: { category: true },
  })

  // Obtener gastos del mes para calcular lo gastado por categoría
  const startOfMonth = new Date(year, month - 1, 1)
  const endOfMonth = new Date(year, month, 0)

  const expenses = await prisma.expense.findMany({
    where: {
      householdId: member.householdId,
      createdAt: { gte: startOfMonth, lte: endOfMonth },
    },
    include: { category: true },
  })

  // Calcular gastado por categoría
  const spentByCategory: Record<string, number> = {}
  for (const exp of expenses) {
    if (exp.categoryId) {
      spentByCategory[exp.categoryId] = (spentByCategory[exp.categoryId] ?? 0) + exp.amount
    }
  }

  return NextResponse.json({
    budgets: budgets.map(b => ({
      ...b,
      spent: spentByCategory[b.categoryId] ?? 0,
    })),
    month,
    year,
    householdId: member.householdId,
  })
}

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const member = await prisma.householdMember.findFirst({
    where: { userId: session.user.id },
  })
  if (!member) return NextResponse.json({ error: 'No household' }, { status: 404 })

  const { categoryName, icon, color, amount, month, year } = await req.json()

  // Crear o obtener categoría
  let category = await prisma.category.findFirst({
    where: { householdId: member.householdId, name: categoryName },
  })

  if (!category) {
    category = await prisma.category.create({
      data: {
        householdId: member.householdId,
        name: categoryName,
        icon: icon ?? '📦',
        color: color ?? '#6b6b72',
      },
    })
  }

  // Crear o actualizar presupuesto
  const budget = await prisma.budget.upsert({
    where: {
      householdId_categoryId_month_year: {
        householdId: member.householdId,
        categoryId: category.id,
        month,
        year,
      },
    },
    create: {
      householdId: member.householdId,
      categoryId: category.id,
      amount,
      month,
      year,
    },
    update: { amount },
    include: { category: true },
  })

  return NextResponse.json(budget)
}
