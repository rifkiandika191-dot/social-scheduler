import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { DashboardClient } from './DashboardClient'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)!
  const userId = session!.user.id

  const [postsTotal, postsScheduled, postsPublished, socialAccounts, recentPosts] = await Promise.all([
    prisma.post.count({ where: { userId } }),
    prisma.post.count({ where: { userId, status: 'scheduled' } }),
    prisma.post.count({ where: { userId, status: 'published' } }),
    prisma.socialAccount.findMany({ where: { userId }, select: { id: true, platform: true, accountName: true, isActive: true } }),
    prisma.post.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        platforms: { include: { socialAccount: true } },
        media: { include: { media: true }, take: 1 },
      },
    }),
  ])

  const totalEngagement = await prisma.analytics.aggregate({
    where: { socialAccount: { userId } },
    _sum: { likes: true, comments: true, shares: true, views: true },
  })

  return (
    <DashboardClient
      stats={{
        postsTotal,
        postsScheduled,
        postsPublished,
        totalEngagement: (totalEngagement._sum.likes || 0) +
          (totalEngagement._sum.comments || 0) +
          (totalEngagement._sum.shares || 0),
        totalViews: totalEngagement._sum.views || 0,
      }}
      socialAccounts={socialAccounts}
      recentPosts={recentPosts as any}
      userName={session!.user.name || 'User'}
    />
  )
}
