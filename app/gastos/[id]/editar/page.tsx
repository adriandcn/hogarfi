import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import EditarGastoClient from './editar-client'

export default async function EditarGastoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/login')

  const expense = await prisma.expense.findUnique({
    where: { id },
    include: {
      splits: true,
      category: true,
      household: {
        include: {
          members: { include: { user: true } },
        },
      },
    },
  })

  if (!expense) redirect('/gastos')

  const members = expense.household.members.map(m => ({
    id: m.id,
    name: m.name ?? m.user?.name ?? 'Sin nombre',
    defaultShare: m.defaultShare,
  }))

  return (
    <EditarGastoClient
      expense={{
        id: expense.id,
        description: expense.description,
        amount: expense.amount,
        paidById: expense.paidById,
        categoryName: expense.category?.name ?? 'Comida',
        date: expense.createdAt.toISOString().split('T')[0],
        splits: expense.splits.map(s => ({
          memberId: s.memberId,
          percentage: s.percentage,
          amount: s.amount,
        })),
      }}
      members={members}
      householdId={expense.householdId}
    />
  )
}