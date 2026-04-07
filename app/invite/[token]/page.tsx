import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function AcceptInvitePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const session = await auth.api.getSession({ headers: await headers() })

  // Si no está logueado, redirigir al login con el token
  if (!session) {
    redirect(`/login?callbackUrl=/invite/${token}`)
  }

  // Buscar la invitación
  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: {
      household: true,
    },
  })

  if (!invitation || invitation.status !== 'PENDING') {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>❌</div>
          <div style={{ fontFamily: 'var(--font-syne)', fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
            Invitación inválida
          </div>
          <div style={{ fontSize: 14, color: 'var(--ink3)' }}>
            Esta invitación ya fue usada o expiró
          </div>
          <a href="/dashboard" style={{ display: 'inline-block', marginTop: 20, background: 'var(--ink)', color: '#fff', borderRadius: 12, padding: '12px 24px', textDecoration: 'none', fontWeight: 600 }}>
            Ir al inicio
          </a>
        </div>
      </div>
    )
  }

  // Verificar si ya pertenece al hogar
  const existingMember = await prisma.householdMember.findFirst({
    where: { householdId: invitation.householdId, userId: session.user.id },
  })

  if (existingMember) {
    redirect('/dashboard')
  }

  // Aceptar invitación — vincular usuario al HouseholdMember existente
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

  redirect('/dashboard')
} 
