import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import ConfigClient from './config-client'

export default async function ConfiguracionPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/login')

  const member = await prisma.householdMember.findFirst({
    where: { userId: session.user.id },
    include: {
      household: {
        include: {
          members: { include: { user: true } },
        },
      },
    },
  })

  if (!member) redirect('/onboarding')

  const household = member.household
  const members = household.members.map(m => ({
    id: m.id,
    name: m.name ?? m.user?.name ?? 'Sin nombre',
    defaultShare: m.defaultShare,
    isMe: m.userId === session.user.id,
    hasAccount: !!m.userId,
  }))

  return (
    <ConfigClient
      householdId={household.id}
      householdName={household.name}
      members={members}
      isAdmin={member.role === 'ADMIN'}
    />
  )
} 
