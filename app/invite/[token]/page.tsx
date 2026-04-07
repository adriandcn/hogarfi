import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import QuickExpenseForm from './quick-expense-form'

export default async function AcceptInvitePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const session = await auth.api.getSession({ headers: await headers() })

  // Buscar invitación
  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: {
      household: {
        include: {
          members: true,
        },
      },
    },
  })

  if (!invitation) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>❌</div>
          <div style={{ fontFamily: 'var(--font-syne)', fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
            Invitación inválida
          </div>
          <div style={{ fontSize: 14, color: 'var(--ink3)' }}>
            Este link no existe o ya expiró
          </div>
        </div>
      </div>
    )
  }

  // Si ya está logueado → vincular y redirigir al dashboard
  if (session) {
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

    redirect('/dashboard')
  }

  // Sin sesión → mostrar formulario rápido de gasto
  const pendingMember = invitation.memberId
    ? invitation.household.members.find(m => m.id === invitation.memberId)
    : null

  const allMembers = invitation.household.members.map(m => ({
    id: m.id,
    name: m.name ?? 'Miembro',
    defaultShare: m.defaultShare,
  }))

  return (
    <QuickExpenseForm
      token={token}
      householdId={invitation.householdId}
      householdName={invitation.household.name}
      memberName={pendingMember?.name ?? 'Tú'}
      memberId={pendingMember?.id ?? ''}
      allMembers={allMembers}
    />
  )
}