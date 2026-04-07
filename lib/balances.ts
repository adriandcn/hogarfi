import { Prisma } from '@prisma/client'

// ─── TIPOS ───────────────────────────────────────────────

export type Balances = Record<
  string,
  { paid: number; paidFor: number; total: number }
>

export type Reimbursement = {
  from: string  // HouseholdMember.id
  to: string    // HouseholdMember.id
  amount: number
}

type ExpenseWithSplits = Prisma.ExpenseGetPayload<{
  include: {
    splits: {
      include: { member: true }
    }
  }
}>

// ─── BALANCES ────────────────────────────────────────────

export function getBalances(expenses: ExpenseWithSplits[]): Balances {
  const balances: Balances = {}

  for (const expense of expenses) {
    const paidById = expense.paidById

    // Inicializa al que pagó
    if (!balances[paidById])
      balances[paidById] = { paid: 0, paidFor: 0, total: 0 }

    balances[paidById].paid += expense.amount

    // Distribuye según porcentajes de cada split
    let remaining = expense.amount

    expense.splits.forEach((split, index) => {
      const memberId = split.memberId

      if (!balances[memberId])
        balances[memberId] = { paid: 0, paidFor: 0, total: 0 }

      const isLast = index === expense.splits.length - 1

      // Al último le damos el remaining para evitar errores de redondeo
      const amount = isLast
        ? remaining
        : parseFloat(((expense.amount * split.percentage) / 100).toFixed(2))

      remaining = parseFloat((remaining - amount).toFixed(2))
      balances[memberId].paidFor += amount
    })
  }

  // Calcula total y limpia zeros negativos
  for (const memberId in balances) {
    balances[memberId].paidFor = Math.round(balances[memberId].paidFor * 100) / 100
    balances[memberId].paid    = Math.round(balances[memberId].paid * 100) / 100
    balances[memberId].total   = 
      Math.round((balances[memberId].paid - balances[memberId].paidFor) * 100) / 100 + 0
  }

  return balances
}

// ─── REIMBURSEMENTS ──────────────────────────────────────

// Algoritmo de Spliit: calcula el mínimo de transferencias para quedar en cero
function compareBalances(
  b1: { memberId: string; total: number },
  b2: { memberId: string; total: number }
): number {
  if (b1.total > 0 && 0 > b2.total) return -1
  if (b2.total > 0 && 0 > b1.total) return 1
  return b1.memberId < b2.memberId ? -1 : 1
}

export function getSuggestedReimbursements(balances: Balances): Reimbursement[] {
  const arr = Object.entries(balances)
    .map(([memberId, { total }]) => ({ memberId, total }))
    .filter((b) => b.total !== 0)

  arr.sort(compareBalances)

  const reimbursements: Reimbursement[] = []

  while (arr.length > 1) {
    const first = arr[0]
    const last  = arr[arr.length - 1]
    const amount = first.total + last.total

    if (first.total > -last.total) {
      reimbursements.push({
        from: last.memberId,
        to: first.memberId,
        amount: Math.round(-last.total * 100) / 100,
      })
      first.total = amount
      arr.pop()
    } else {
      reimbursements.push({
        from: last.memberId,
        to: first.memberId,
        amount: Math.round(first.total * 100) / 100,
      })
      last.total = amount
      arr.shift()
    }
  }

  return reimbursements.filter(({ amount }) => Math.round(amount * 100) / 100 !== 0)
}

// ─── HELPER: calcula splits desde porcentajes default ────

export function calculateSplitsFromShares(
  amount: number,
  members: { id: string; defaultShare: number }[]
): { memberId: string; percentage: number; amount: number }[] {
  // Valida que sumen 100
  const total = members.reduce((s, m) => s + m.defaultShare, 0)
  if (Math.abs(total - 100) > 0.01) {
    throw new Error(`Los porcentajes deben sumar 100. Suma actual: ${total}`)
  }

  let remaining = amount

  return members.map((member, index) => {
    const isLast = index === members.length - 1
    const splitAmount = isLast
      ? remaining
      : parseFloat(((amount * member.defaultShare) / 100).toFixed(2))

    remaining = parseFloat((remaining - splitAmount).toFixed(2))

    return {
      memberId:   member.id,
      percentage: member.defaultShare,
      amount:     splitAmount,
    }
  })
}