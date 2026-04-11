import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'
import QuickExpenseForm from './quick-expense-form'
import AcceptInviteClient from './accept-invite-client'

export default async function AcceptInvitePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const session = await auth.api.getSession({ headers: await headers() })

  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: {
      household: { include: { members: true } },
    },
  })

  if (!invitation) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--off)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>❌</div>
          <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Invitacion invalida</div>
          <div style={{ fontSize: 14, color: 'var(--muted)' }}>Este link no existe o ya expiro</div>
        </div>
      </div>
    )
  }

  const pendingMember = invitation.memberId
    ? invitation.household.members.find(m => m.id === invitation.memberId)
    : null

  const allMembers = invitation.household.members.map(m => ({
    id: m.id,
    name: m.name ?? 'Miembro',
    defaultShare: m.defaultShare,
  }))

  if (session) {
    return (
      <AcceptInviteClient
        token={token}
        householdName={invitation.household.name}
        memberName={pendingMember?.name ?? session.user.name ?? 'Miembro'}
        userName={session.user.name ?? ''}
      />
    )
  }

  return (
    <QuickExpenseForm
      token={token}
      householdId={invitation.householdId}
      householdName={invitation.household.name}
      memberName={pendingMember?.name ?? 'Tu'}
      memberId={pendingMember?.id ?? ''}
      allMembers={allMembers}
    />
  )
}