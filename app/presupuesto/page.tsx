import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import BudgetClient from './budget-client'

export default async function PresupuestoPage({
  searchParams,
}: {
  searchParams: Promise<{ setup?: string }>
}) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/login')
  const { setup } = await searchParams
  return <BudgetClient isSetup={setup === 'true'} />
}