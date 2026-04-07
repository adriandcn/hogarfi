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
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  emailAndPassword: {
    enabled: true,
  },
  user: {
    modelName: 'betterAuthUser',
  },
  session: {
    modelName: 'betterAuthSession',
  },
  account: {
    modelName: 'betterAuthAccount',
  },
  verification: {
    modelName: 'betterAuthVerification',
  },
trustedOrigins: [
  'http://localhost:3000',
  process.env.BETTER_AUTH_URL ?? '',
  process.env.NEXT_PUBLIC_APP_URL ?? '',
].filter(Boolean),
})

export type Session = typeof auth.$Infer.Session