 
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, members } = await req.json()

  if (!name || !members || members.length < 2) {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
  }

  const total = members.reduce((s: number, m: any) => s + m.share, 0)
  if (Math.abs(total - 100) > 0.5) {
    return NextResponse.json({ error: 'Shares must sum 100' }, { status: 400 })
  }

  // Crear hogar con el usuario actual como admin
  const household = await prisma.household.create({
    data: {
      name,
      members: {
        create: {
          userId: session.user.id,
          role: 'ADMIN',
          defaultShare: members[0].share,
        },
      },
      subscription: {
        create: {
          plan: 'FREE',
          status: 'TRIALING',
          trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      },
    },
  })

  // Los otros miembros se agregan cuando acepten la invitación
  // Por ahora guardamos sus nombres como invitaciones pendientes
  for (const member of members.slice(1)) {
    if (member.name) {
      await prisma.invitation.create({
        data: {
          householdId: household.id,
          invitedBy: session.user.id,
          email: null,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      })
    }
  }

  return NextResponse.json({ householdId: household.id })
}