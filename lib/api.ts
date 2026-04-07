import { prisma } from '@/lib/prisma'
import { calculateSplitsFromShares } from '@/lib/balances'

// ─── HOGAR ───────────────────────────────────────────────

export async function getHousehold(householdId: string) {
  return prisma.household.findUnique({
    where: { id: householdId },
    include: { members: { include: { user: true } } },
  })
}

export async function getHouseholdMembers(householdId: string) {
  return prisma.householdMember.findMany({
    where: { householdId },
    include: { user: true },
  })
}

// ─── GASTOS ──────────────────────────────────────────────

export async function getHouseholdExpenses(
  householdId: string,
  options?: { offset?: number; length?: number }
) {
  return prisma.expense.findMany({
    where: { householdId },
    include: {
      splits: {
        include: { member: { include: { user: true } } },
      },
      category: true,
    },
    orderBy: { createdAt: 'desc' },
    skip: options?.offset,
    take: options?.length ?? 50,
  })
}

export async function createExpense({
  householdId,
  paidById,
  description,
  amount,
  categoryId,
  useDefaultShares = true,
  customShares,
}: {
  householdId: string
  paidById: string        // HouseholdMember.id
  description: string
  amount: number
  categoryId?: string
  useDefaultShares?: boolean
  customShares?: { memberId: string; percentage: number }[]
}) {
  // Obtener miembros del hogar
  const members = await prisma.householdMember.findMany({
    where: { householdId },
  })

  // Calcular splits
  const sharesInput = useDefaultShares
    ? members.map(m => ({ id: m.id, defaultShare: m.defaultShare }))
    : customShares!.map(s => ({
        id: s.memberId,
        defaultShare: s.percentage,
      }))

  const splits = calculateSplitsFromShares(amount, sharesInput)

  return prisma.expense.create({
    data: {
      householdId,
      paidById,
      description,
      amount,
      categoryId,
      useDefaultShares,
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
    include: {
      splits: { include: { member: true } },
      category: true,
    },
  })
}

export async function deleteExpense(expenseId: string) {
  return prisma.expense.delete({
    where: { id: expenseId },
  })
}

// ─── PRESUPUESTO ─────────────────────────────────────────

export async function getBudgets(householdId: string, month: number, year: number) {
  return prisma.budget.findMany({
    where: { householdId, month, year },
    include: { category: true },
  })
}

export async function getCategories(householdId: string) {
  return prisma.category.findMany({
    where: { householdId },
  })
}

// ─── SUSCRIPCION ─────────────────────────────────────────

export async function getSubscription(householdId: string) {
  return prisma.subscription.findUnique({
    where: { householdId },
  })
}

// ─── PLAN LIMITS ─────────────────────────────────────────

export async function checkExpenseLimit(householdId: string): Promise<boolean> {
  const sub = await getSubscription(householdId)
  const plan = sub?.plan ?? 'FREE'

  if (plan !== 'FREE') return true // Sin límite en planes pagos

  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const count = await prisma.expense.count({
    where: {
      householdId,
      createdAt: { gte: startOfMonth },
    },
  })

  return count < 15 // Límite free: 15 gastos/mes
}