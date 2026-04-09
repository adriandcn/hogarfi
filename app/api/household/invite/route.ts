import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const householdIdParam = searchParams.get('householdId')

  const member = await prisma.householdMember.findFirst({
    where: {
      userId: session.user.id,
      ...(householdIdParam ? { householdId: householdIdParam } : {}),
    },
    include: {
      household: {
        include: {
          members: true,
          invitations: {
            where: { status: 'PENDING' },
          },
        },
      },
    },
  })

  if (!member) return NextResponse.json({ error: 'No household' }, { status: 404 })

  const baseUrl = process.env.BETTER_AUTH_URL ?? 'http://localhost:3000'
  const invitations = member.household.invitations.map(inv => {
    const pendingMember = member.household.members.find(m => m.id === inv.memberId)
    return {
      id: inv.id,
      memberName: pendingMember?.name ?? 'Miembro',
      link: `${baseUrl}/invite/${inv.token}`,
      expiresAt: inv.expiresAt,
    }
  })

  return NextResponse.json({
    householdName: member.household.name,
    invitations,
  })
}