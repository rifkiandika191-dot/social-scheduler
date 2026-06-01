import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const account = await prisma.socialAccount.findFirst({
    where: { id: params.id, userId: session.user.id },
  })
  if (!account) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.socialAccount.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
