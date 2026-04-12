import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { token } = await req.json()

  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: {
      household: { include: { members: true } },
    },
  })

  if (!invitation) return NextResponse.json({ error: 'Invalid token' }, { status: 404 })

  const existingMember = await prisma.householdMember.findFirst({
    where: { householdId: invitation.householdId, userId: session.user.id },
  })

  if (!existingMember) {
    if (invitation.memberId) {
      await prisma.householdMember.update({
        where: { id: invitation.memberId },
        data: { userId: session.user.id },
      })
    } else {
      await prisma.householdMember.create({
        data: {
          householdId: invitation.householdId,
          userId: session.user.id,
          name: session.user.name,
          role: 'MEMBER',
          defaultShare: 0,
        },
      })
    }

    await prisma.invitation.update({
      where: { token },
      data: { status: 'ACCEPTED' },
    })
  }

  const res = NextResponse.json({ householdId: invitation.householdId })
  res.cookies.set('active_household', invitation.householdId, {
    httpOnly: false,
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
  })
  return res
} 
