import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, members } = await req.json()

  if (!name || !members || members.length < 1) {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
  }

  const total = members.reduce((s: number, m: any) => s + m.share, 0)
  if (Math.abs(total - 100) > 0.5) {
    return NextResponse.json({ error: 'Shares must sum 100' }, { status: 400 })
  }

  const household = await prisma.household.create({
    data: {
      name,
      subscription: {
        create: {
          plan: 'FREE',
          status: 'TRIALING',
          trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      },
    },
  })

  // Primer miembro = admin con cuenta
  await prisma.householdMember.create({
    data: {
      householdId: household.id,
      userId: session.user.id,
      name: session.user.name,
      role: 'ADMIN',
      defaultShare: members[0].share,
    },
  })

  // Resto de miembros sin cuenta — se unen por invitación
  for (let i = 1; i < members.length; i++) {
    const m = members[i]
    if (!m.name) continue

    const member = await prisma.householdMember.create({
      data: {
        householdId: household.id,
        userId: null,
        name: m.name,
        role: 'MEMBER',
        defaultShare: m.share,
      },
    })

    // Crear invitación para ese miembro
    await prisma.invitation.create({
      data: {
        householdId: household.id,
        invitedBy: session.user.id,
        memberId: member.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    })
  }

  return NextResponse.json({ householdId: household.id })
}