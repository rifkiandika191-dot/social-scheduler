import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  const password = await bcrypt.hash('demo123', 12)
  const user = await prisma.user.upsert({
    where: { email: 'admin@demo.com' },
    update: {},
    create: {
      name:          'Demo User',
      email:         'admin@demo.com',
      password,
      emailVerified: true,   // demo user sudah verified
      plan:          'pro',  // demo pakai plan pro
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
    prisma.socialAccount.upsert({
      where: { id: 'demo-tt' },
      update: {},
      create: { id: 'demo-tt', platform: 'tiktok', accountId: 'tt_demo', accountName: '@demo_tiktok', accessToken: 'mock_token_tt', userId: user.id },
    }),
  ])

  const now = new Date()
  for (let i = 0; i < 30; i++) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    for (const acc of accounts) {
      await prisma.analytics.upsert({
        where: { id: `analytics-${acc.id}-${i}` },
        update: {},
        create: {
          id:             `analytics-${acc.id}-${i}`,
          socialAccountId: acc.id,
          date,
          likes:       Math.floor(Math.random() * 500  + 100),
          comments:    Math.floor(Math.random() * 80   + 10),
          shares:      Math.floor(Math.random() * 150  + 20),
          views:       Math.floor(Math.random() * 5000 + 500),
          reach:       Math.floor(Math.random() * 3000 + 300),
          impressions: Math.floor(Math.random() * 8000 + 800),
          saves:       Math.floor(Math.random() * 200  + 20),
          clicks:      Math.floor(Math.random() * 300  + 30),
        },
      })
    }
  }

  await prisma.notification.createMany({
    data: [
      { userId: user.id, type: 'post_published', title: 'Post Berhasil Tayang', message: 'Konten "Morning vibes ☀️" berhasil dipublikasikan ke Instagram.' },
      { userId: user.id, type: 'post_failed',    title: 'Unggahan Gagal',        message: 'Post ke TikTok gagal. Silakan coba lagi.' },
      { userId: user.id, type: 'info',           title: 'Selamat Datang!',       message: 'Akun demo aktif. Mulai buat konten pertama Anda!' },
    ],
  })

  console.log('✅ Seeding selesai! Login: admin@demo.com / demo123')
}

main()
  .then(() => prisma.$disconnect())
  .catch(async e => { console.error(e); await prisma.$disconnect(); process.exit(1) })
