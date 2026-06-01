import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { slugify } from '@/lib/utils'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const teamMember = await prisma.teamMember.findFirst({
    where: { userId: session.user.id },
    include: { team: true },
  })

  if (!teamMember) {
    const ownedTeam = await prisma.team.findFirst({ where: { ownerId: session.user.id } })
    if (ownedTeam) {
      const members = await prisma.teamMember.findMany({
        where: { teamId: ownedTeam.id },
        include: { user: true },
      })
      return NextResponse.json({ team: ownedTeam, members })
    }
    return NextResponse.json({ team: null, members: [] })
  }

  const members = await prisma.teamMember.findMany({
    where: { teamId: teamMember.teamId },
    include: { user: true },
  })

  return NextResponse.json({ team: teamMember.team, members })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name } = await req.json()
  if (!name) return NextResponse.json({ error: 'Nama tim diperlukan.' }, { status: 400 })

  let slug = slugify(name)
  const existing = await prisma.team.findUnique({ where: { slug } })
  if (existing) slug = `${slug}-${Date.now()}`

  const team = await prisma.team.create({
    data: {
      name,
      slug,
      ownerId: session.user.id,
      members: {
        create: { userId: session.user.id, role: 'owner' },
      },
    },
  })

  return NextResponse.json({ team }, { status: 201 })
}
