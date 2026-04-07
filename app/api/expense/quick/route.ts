import { prisma } from '@/lib/prisma'
import { calculateSplitsFromShares } from '@/lib/balances'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { token, householdId, paidById, description, amount, categoryName, icon } = await req.json()

  // Verificar que el token es válido para este hogar
  const invitation = await prisma.invitation.findUnique({
    where: { token },
  })

  if (!invitation || invitation.householdId !== householdId) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 403 })
  }

  // Obtener miembros del hogar
  const members = await prisma.householdMember.findMany({
    where: { householdId },
  })

  // Obtener o crear categoría
  let category = await prisma.category.findFirst({
    where: { householdId, name: categoryName },
  })
  if (!category) {
    category = await prisma.category.create({
      data: { householdId, name: categoryName, icon: icon ?? '📦' },
    })
  }

  // Calcular splits
  const splits = calculateSplitsFromShares(
    amount,
    members.map(m => ({ id: m.id, defaultShare: m.defaultShare }))
  )

  // Crear gasto
  const expense = await prisma.expense.create({
    data: {
      householdId,
      paidById,
      description,
      amount,
      categoryId: category.id,
      useDefaultShares: true,
      splits: {
        createMany: {
          data: splits.map(s => ({
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
