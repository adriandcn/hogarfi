import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { householdId, name, share } = await req.json()

  const admin = await prisma.householdMember.findFirst({
    where: { householdId, userId: session.user.id, role: 'ADMIN' },
  })
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const member = await prisma.householdMember.create({
    data: {
      householdId,
      userId: null,
      name,
      role: 'MEMBER',
      defaultShare: share,
    },
  })

  const invitation = await prisma.invitation.create({
    data: {
      householdId,
      invitedBy: session.user.id,
      memberId: member.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  })

  return NextResponse.json({ id: member.id, invitationToken: invitation.token })
} 
