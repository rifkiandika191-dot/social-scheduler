import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

// Protected dengan secret key
export async function POST(req: NextRequest) {
  const { secret } = await req.json()
  if (secret !== process.env.NEXTAUTH_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const password = await bcrypt.hash('demo123', 12)
  const user = await prisma.user.upsert({
    where: { email: 'admin@demo.com' },
    update: { emailVerified: true, plan: 'pro' },
    create: {
      name: 'Demo User',
      email: 'admin@demo.com',
      password,
      emailVerified: true,
      plan: 'pro',
    },
  })

  const accounts = await Promise.all([
    prisma.socialAccount.upsert({
      where: { id: 'demo-ig' },
      update: {},
      create: { id: 'demo-ig', platform: 'instagram', accountId: 'ig_demo', accountName: '@demo_instagram', accessToken: 'mock_token_ig', userId: user.id },
    }),
    prisma.socialAccount.upsert({
      where: { id: 'demo-tw' },
      update: {},
      create: { id: 'demo-tw', platform: 'twitter', accountId: 'tw_demo', accountName: '@demo_twitter', accessToken: 'mock_token_tw', userId: user.id },
    }),
  ])

  const now = new Date()
  for (let i = 0; i < 14; i++) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    for (const acc of accounts) {
      await prisma.analytics.upsert({
        where: { id: `prod-analytics-${acc.id}-${i}` },
        update: {},
        create: {
          id: `prod-analytics-${acc.id}-${i}`,
          socialAccountId: acc.id,
          date,
          likes: Math.floor(Math.random() * 500 + 100),
          comments: Math.floor(Math.random() * 80 + 10),
          shares: Math.floor(Math.random() * 150 + 20),
          views: Math.floor(Math.random() * 5000 + 500),
          reach: Math.floor(Math.random() * 3000 + 300),
          impressions: Math.floor(Math.random() * 8000 + 800),
          saves: Math.floor(Math.random() * 200 + 20),
          clicks: Math.floor(Math.random() * 300 + 30),
        },
      })
    }
  }

  return NextResponse.json({ success: true, message: 'Database seeded! Login: admin@demo.com / demo123' })
}
