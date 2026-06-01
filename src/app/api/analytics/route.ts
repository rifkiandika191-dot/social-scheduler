import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { format, subDays, eachDayOfInterval } from 'date-fns'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const days = Number(searchParams.get('days')) || 30
  const platformFilter = searchParams.get('platform') || 'all'

  const startDate = subDays(new Date(), days)

  const accounts = await prisma.socialAccount.findMany({
    where: { userId: session.user.id, ...(platformFilter !== 'all' ? { platform: platformFilter } : {}) },
  })

  const accountIds = accounts.map(a => a.id)

  if (accountIds.length === 0) {
    return NextResponse.json({
      totals: { views: 0, likes: 0, comments: 0, shares: 0, reach: 0, impressions: 0 },
      dailyData: [],
      platformData: [],
      topPosts: [],
    })
  }

  const analytics = await prisma.analytics.findMany({
    where: { socialAccountId: { in: accountIds }, date: { gte: startDate } },
    include: { socialAccount: true },
  })

  const totals = analytics.reduce((acc, a) => ({
    views:       acc.views + a.views,
    likes:       acc.likes + a.likes,
    comments:    acc.comments + a.comments,
    shares:      acc.shares + a.shares,
    reach:       acc.reach + a.reach,
    impressions: acc.impressions + a.impressions,
  }), { views: 0, likes: 0, comments: 0, shares: 0, reach: 0, impressions: 0 })

  const dateRange = eachDayOfInterval({ start: startDate, end: new Date() })
  const dailyData = dateRange.map(date => {
    const dateStr = format(date, 'yyyy-MM-dd')
    const dayAnalytics = analytics.filter(a => format(new Date(a.date), 'yyyy-MM-dd') === dateStr)
    return {
      date: format(date, 'dd/MM'),
      likes:    dayAnalytics.reduce((s, a) => s + a.likes, 0),
      views:    dayAnalytics.reduce((s, a) => s + a.views, 0),
      comments: dayAnalytics.reduce((s, a) => s + a.comments, 0),
      shares:   dayAnalytics.reduce((s, a) => s + a.shares, 0),
    }
  })

  const platformMap = new Map<string, { name: string; platform: string; value: number }>()
  for (const a of analytics) {
    const key = a.socialAccount.platform
    const existing = platformMap.get(key)
    if (existing) {
      existing.value += a.likes + a.comments + a.shares
    } else {
      platformMap.set(key, {
        name: a.socialAccount.accountName,
        platform: key,
        value: a.likes + a.comments + a.shares,
      })
    }
  }

  const topPostsData = await prisma.analytics.groupBy({
    by: ['postPlatformId'],
    where: { socialAccountId: { in: accountIds }, postPlatformId: { not: null } },
    _sum: { likes: true, views: true, comments: true },
    orderBy: { _sum: { views: 'desc' } },
    take: 5,
  })

  const topPosts = await Promise.all(
    topPostsData.map(async item => {
      if (!item.postPlatformId) return null
      const pp = await prisma.postPlatform.findUnique({
        where: { id: item.postPlatformId },
        include: { post: { include: { media: { include: { media: true }, take: 1 } } } },
      })
      if (!pp) return null
      return {
        id: pp.post.id,
        caption: pp.post.caption,
        thumbnail: pp.post.media[0]?.media?.url,
        likes: item._sum.likes || 0,
        views: item._sum.views || 0,
        comments: item._sum.comments || 0,
      }
    })
  )

  return NextResponse.json({
    totals,
    dailyData,
    platformData: Array.from(platformMap.values()),
    topPosts: topPosts.filter(Boolean),
  })
}
