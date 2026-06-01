import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const post = await prisma.post.findFirst({ where: { id: params.id, userId: session.user.id } })
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.post.update({ where: { id: params.id }, data: { status: 'publishing' } })
  await prisma.postPlatform.updateMany({
    where: { postId: params.id, status: 'failed' },
    data: { status: 'pending', error: null, retryCount: { increment: 1 } },
  })

  setTimeout(async () => {
    const platforms = await prisma.postPlatform.findMany({ where: { postId: params.id, status: 'pending' } })
    for (const pp of platforms) {
      const success = Math.random() < 0.85
      if (success) {
        await prisma.postPlatform.update({
          where: { id: pp.id },
          data: { status: 'published', publishedAt: new Date(), platformPostId: `post_retry_${Date.now()}` },
        })
        await prisma.analytics.create({
          data: {
            date: new Date(),
            socialAccountId: pp.socialAccountId,
            postPlatformId: pp.id,
            likes: Math.floor(Math.random() * 300),
            comments: Math.floor(Math.random() * 30),
            shares: Math.floor(Math.random() * 60),
            views: Math.floor(Math.random() * 3000),
            reach: Math.floor(Math.random() * 2000),
            impressions: Math.floor(Math.random() * 5000),
          },
        })
      } else {
        await prisma.postPlatform.update({
          where: { id: pp.id },
          data: { status: 'failed', error: 'Masih gagal. Periksa koneksi platform.' },
        })
      }
    }
    const allPlatforms = await prisma.postPlatform.findMany({ where: { postId: params.id } })
    const anyPublished = allPlatforms.some(p => p.status === 'published')
    await prisma.post.update({
      where: { id: params.id },
      data: { status: anyPublished ? 'published' : 'failed', publishedAt: anyPublished ? new Date() : null },
    })
  }, 1500)

  return NextResponse.json({ success: true })
}
