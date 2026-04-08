import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { fromMemberId, toMemberId, amount, householdId } = await req.json()

  // Crear un gasto de reembolso que salda la deuda
  const member = await prisma.householdMember.findFirst({
    where: { userId: session.user.id, householdId },
  })
  if (!member) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  // Obtener o crear categoría de liquidación
  let category = await prisma.category.findFirst({
    where: { householdId, name: 'Liquidación' },
  })
  if (!category) {
    category = await prisma.category.create({
      data: { householdId, name: 'Liquidación', icon: '⚖️', color: '#6b6b72' },
    })
  }

  // Crear gasto de reembolso — el que debe paga al que se le debe
  await prisma.expense.create({
    data: {
      householdId,
      paidById: fromMemberId,
      description: 'Liquidación de deuda',
      amount,
      categoryId: category.id,
      useDefaultShares: false,
      splits: {
        createMany: {
          data: [
            { memberId: fromMemberId, percentage: 0, amount: 0 },
            { memberId: toMemberId, percentage: 100, amount },
          ],
        },
      },
    },
  })

  return NextResponse.json({ ok: true })
} 
