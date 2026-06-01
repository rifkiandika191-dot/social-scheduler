import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { sendEmail, postFailedEmail } from '@/lib/email'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') || undefined

  const posts = await prisma.post.findMany({
    where: {
      userId: session.user.id,
      ...(status ? { status } : {}),
    },
    orderBy: { createdAt: 'desc' },
    include: {
      platforms: { include: { socialAccount: true } },
      media:     { include: { media: true }, orderBy: { order: 'asc' } },
    },
  })

  return NextResponse.json({ posts })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { caption, hashtags, isStory, scheduledAt, platformAccountIds, mediaUrls, mediaFilters } = body

    if (!platformAccountIds?.length) {
      return NextResponse.json({ error: 'Pilih minimal satu platform.' }, { status: 400 })
    }

    const status = scheduledAt ? 'scheduled' : 'publishing'

    const post = await prisma.post.create({
      data: {
        caption,
        hashtags,
        isStory: Boolean(isStory),
        status,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        userId: session.user.id,
      },
    })

    if (mediaUrls?.length) {
      for (let i = 0; i < mediaUrls.length; i++) {
        const url = mediaUrls[i]
        const mf = mediaFilters?.[i]
        const videoExts = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.flv', '.wmv', '.m4v', '.3gp', '.ts', '.m2ts']
        const isVideo = videoExts.some(ext => url.toLowerCase().endsWith(ext))
        const media = await prisma.media.create({
          data: {
            type: isVideo ? 'video' : 'image',
            url,
            filename: url.split('/').pop() || 'media',
            size: 0,
            filters: mf?.filters ? JSON.stringify(mf.filters) : null,
            overlays: mf?.overlays ? JSON.stringify(mf.overlays) : null,
          },
        })
        await prisma.postMedia.create({ data: { postId: post.id, mediaId: media.id, order: i } })
      }
    }

    for (const accountId of platformAccountIds) {
      await prisma.postPlatform.create({
        data: { postId: post.id, socialAccountId: accountId, status: scheduledAt ? 'pending' : 'pending' },
      })
    }

    if (!scheduledAt) {
      await simulatePublish(post.id, session.user.id, session.user.email || '')
    }

    const result = await prisma.post.findUnique({
      where: { id: post.id },
      include: { platforms: { include: { socialAccount: true } }, media: { include: { media: true } } },
    })

    return NextResponse.json({ post: result }, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Terjadi kesalahan.' }, { status: 500 })
  }
}

async function simulatePublish(postId: string, userId: string, email: string) {
  const delay = Math.random() * 2000 + 500
  await new Promise(r => setTimeout(r, delay))

  const platforms = await prisma.postPlatform.findMany({ where: { postId } })
  const successRate = 0.9

  for (const pp of platforms) {
    const success = Math.random() < successRate
    if (success) {
      await prisma.postPlatform.update({
        where: { id: pp.id },
        data: { status: 'published', publishedAt: new Date(), platformPostId: `post_${Date.now()}` },
      })
      const acc = await prisma.socialAccount.findUnique({ where: { id: pp.socialAccountId } })
      await prisma.analytics.create({
        data: {
          date: new Date(),
          socialAccountId: pp.socialAccountId,
          postPlatformId: pp.id,
          likes: Math.floor(Math.random() * 500),
          comments: Math.floor(Math.random() * 50),
          shares: Math.floor(Math.random() * 100),
          views: Math.floor(Math.random() * 5000),
          reach: Math.floor(Math.random() * 3000),
          impressions: Math.floor(Math.random() * 8000),
        },
      })
    } else {
      const errMsg = 'Koneksi ke platform terputus. Silakan coba lagi.'
      await prisma.postPlatform.update({
        where: { id: pp.id },
        data: { status: 'failed', error: errMsg },
      })
      const post = await prisma.post.findUnique({ where: { id: postId } })
      const user = await prisma.user.findUnique({ where: { id: userId } })
      const acc = await prisma.socialAccount.findUnique({ where: { id: pp.socialAccountId } })
      if (user && acc) {
        await prisma.notification.create({
          data: {
            userId,
            type: 'post_failed',
            title: `Unggahan Gagal - ${acc.platform}`,
            message: `Post "${post?.caption?.slice(0, 50) || '(tanpa caption)'}..." gagal diunggah ke ${acc.accountName}.`,
          },
        })
        await sendEmail({
          to: email,
          subject: `Unggahan Gagal ke ${acc.platform}`,
          html: postFailedEmail({
            userName: user.name,
            postCaption: post?.caption || '(tanpa caption)',
            platform: acc.platform,
            errorMessage: errMsg,
            retryUrl: `${process.env.NEXTAUTH_URL}/schedule`,
          }),
        })
      }
    }
  }

  const allPlatforms = await prisma.postPlatform.findMany({ where: { postId } })
  const allFailed = allPlatforms.every(p => p.status === 'failed')
  const anyPublished = allPlatforms.some(p => p.status === 'published')

  await prisma.post.update({
    where: { id: postId },
    data: {
      status: allFailed ? 'failed' : 'published',
      publishedAt: anyPublished ? new Date() : null,
    },
  })
}
