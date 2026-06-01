import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const accounts = await prisma.socialAccount.findMany({
    where: { userId: session.user.id, isActive: true },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json({ accounts })
}

const schema = z.object({
  platform:     z.string(),
  accountName:  z.string().min(1),
  accountId:    z.string(),
  accessToken:  z.string(),
  refreshToken: z.string().optional(),
  accountImage: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const data = schema.parse(body)

    const account = await prisma.socialAccount.create({
      data: { ...data, userId: session.user.id },
    })

    return NextResponse.json({ account }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: 'Gagal menambah akun.' }, { status: 400 })
  }
}
