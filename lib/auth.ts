import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { prisma } from '@/lib/prisma'

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:3000',
  secret: process.env.BETTER_AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
    usePlural: false,
  }),
  advanced: {
    disableCsrfCheck: true,
    crossSubDomainCookies: {
      enabled: false,
    },
    defaultCookieAttributes: {
      sameSite: 'none',
      secure: true,
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  emailAndPassword: {
    enabled: true,
  },
  user: { modelName: 'betterAuthUser' },
  session: { modelName: 'betterAuthSession' },
  account: { modelName: 'betterAuthAccount' },
  verification: { modelName: 'betterAuthVerification' },
  trustedOrigins: [
    'http://localhost:3000',
    'https://hogarfi.vercel.app',
    'https://hogarfi-rj0kg4mrj-adrian22.vercel.app',
    'https://hogarfi-ib8vsciri-adrian22.vercel.app',
    'https://hogarfi-jpcf6796f-adrian22.vercel.app',
    'https://hogarfi-hc75yi43q-adrian22.vercel.app',
    process.env.BETTER_AUTH_URL ?? '',
    process.env.NEXT_PUBLIC_APP_URL ?? '',
  ].filter(Boolean),
})

export type Session = typeof auth.$Infer.Session