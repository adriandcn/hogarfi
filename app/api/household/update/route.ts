import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { householdId, name, shares } = await req.json()

  const member = await prisma.householdMember.findFirst({
    where: { householdId, userId: session.user.id, role: 'ADMIN' },
  })
  if (!member) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  // Actualizar nombre del hogar
  await prisma.household.update({
    where: { id: householdId },
    data: { name },
  })

  // Actualizar porcentajes de cada miembro
  for (const [memberId, share] of Object.entries(shares)) {
    await prisma.householdMember.update({
      where: { id: memberId },
      data: { defaultShare: share as number },
    })
  }

  return NextResponse.json({ ok: true })
} 
