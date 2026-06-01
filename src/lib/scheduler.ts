import { prisma } from './db'
import { sendEmail, postFailedEmail } from './email'

export async function processScheduledPosts() {
  const now = new Date()

  const duePosts = await prisma.post.findMany({
    where: {
      status: 'scheduled',
      scheduledAt: { lte: now },
    },
    include: {
      platforms: { include: { socialAccount: true } },
      user: true,
    },
  })

  for (const post of duePosts) {
    await prisma.post.update({ where: { id: post.id }, data: { status: 'publishing' } })

    for (const pp of post.platforms) {
      if (pp.status !== 'pending') continue

      const success = Math.random() < 0.9
      if (success) {
        await prisma.postPlatform.update({
          where: { id: pp.id },
          data: { status: 'published', publishedAt: new Date(), platformPostId: `scheduled_${Date.now()}` },
        })
        await prisma.analytics.create({
          data: {
            date: new Date(),
            socialAccountId: pp.socialAccountId,
            postPlatformId: pp.id,
            likes:       Math.floor(Math.random() * 400 + 50),
            comments:    Math.floor(Math.random() * 60 + 5),
            shares:      Math.floor(Math.random() * 120 + 10),
            views:       Math.floor(Math.random() * 4000 + 200),
            reach:       Math.floor(Math.random() * 2500 + 100),
            impressions: Math.floor(Math.random() * 7000 + 300),
          },
        })
      } else {
        await prisma.postPlatform.update({
          where: { id: pp.id },
          data: { status: 'failed', error: 'Gagal mengunggah ke platform.' },
        })
        await prisma.notification.create({
          data: {
            userId: post.userId,
            type: 'post_failed',
            title: `Jadwal Gagal - ${pp.socialAccount.platform}`,
            message: `Post terjadwal gagal dipublikasikan ke ${pp.socialAccount.accountName}.`,
          },
        })
        await sendEmail({
          to: post.user.email,
          subject: `Jadwal Post Gagal - ${pp.socialAccount.platform}`,
          html: postFailedEmail({
            userName: post.user.name,
            postCaption: post.caption || '(tanpa caption)',
            platform: pp.socialAccount.platform,
            errorMessage: 'Gagal mengunggah ke platform.',
            retryUrl: `${process.env.NEXTAUTH_URL}/schedule`,
          }),
        })
      }
    }

    const updatedPlatforms = await prisma.postPlatform.findMany({ where: { postId: post.id } })
    const anyPublished = updatedPlatforms.some(p => p.status === 'published')
    const allFailed = updatedPlatforms.every(p => p.status === 'failed')

    await prisma.post.update({
      where: { id: post.id },
      data: {
        status: allFailed ? 'failed' : 'published',
        publishedAt: anyPublished ? new Date() : null,
      },
    })
  }

  return duePosts.length
}
