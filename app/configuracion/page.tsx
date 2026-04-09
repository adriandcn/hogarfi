import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import ConfigClient from './config-client'

export default async function ConfiguracionPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/login')

  const cookieStore = await cookies()
  const activeHouseholdId = cookieStore.get('active_household')?.value

  // Todos los hogares del usuario
  const allMembers = await prisma.householdMember.findMany({
    where: { userId: session.user.id },
    include: {
      household: {
        include: {
          members: { include: { user: true } },
        },
      },
    },
  })

  if (!allMembers.length) redirect('/onboarding')

  // Hogar activo — por cookie o el primero
  const activeMember = allMembers.find(m => m.householdId === activeHouseholdId) ?? allMembers[0]
  const household = activeMember.household

  const members = household.members.map(m => ({
    id: m.id,
    name: m.name ?? m.user?.name ?? 'Sin nombre',
    defaultShare: m.defaultShare,
    isMe: m.userId === session.user.id,
    hasAccount: !!m.userId,
  }))

  const myHouseholds = allMembers.map(m => ({
    id: m.householdId,
    name: m.household.name,
    isActive: m.householdId === activeMember.householdId,
    memberCount: m.household.members.length,
  }))

  return (
    <ConfigClient
      householdId={household.id}
      householdName={household.name}
      members={members}
      isAdmin={activeMember.role === 'ADMIN'}
      myHouseholds={myHouseholds}
    />
  )
}