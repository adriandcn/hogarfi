import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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

  if (!member) return NextResponse.json({ error: 'No household' }, { status: 404 })

  return NextResponse.json({
    householdId: member.householdId,
    myMemberId: member.id,
    members: member.household.members.map(m => ({
      id: m.id,
      name: m.user.name ?? 'Sin nombre',
      defaultShare: m.defaultShare,
    })),
  })
} 
