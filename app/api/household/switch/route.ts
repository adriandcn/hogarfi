 import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { householdId } = await req.json()
  const res = NextResponse.json({ ok: true })
  res.cookies.set('active_household', householdId, {
    httpOnly: false,
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
  })
  return res
}
