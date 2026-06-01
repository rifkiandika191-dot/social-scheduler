import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { sendEmail, teamInviteEmail } from '@/lib/email'
import { addDays } from 'date-fns'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { email, role } = await req.json()

  const team = await prisma.team.findFirst({ where: { ownerId: session.user.id } })
  if (!team) return NextResponse.json({ error: 'Buat tim terlebih dahulu.' }, { status: 400 })

  const invite = await prisma.teamInvite.create({
    data: {
      email,
      role: role || 'member',
      teamId: team.id,
      expiresAt: addDays(new Date(), 7),
    },
  })

  const inviteUrl = `${process.env.NEXTAUTH_URL}/invite/${invite.token}`

  await sendEmail({
    to: email,
    subject: `Undangan bergabung ke tim ${team.name}`,
    html: teamInviteEmail({
      inviterName: session.user.name || 'Seseorang',
      teamName: team.name,
      inviteUrl,
    }),
  })

  await prisma.notification.create({
    data: {
      userId: session.user.id,
      type: 'team_invite',
      title: 'Undangan Dikirim',
      message: `Undangan dikirim ke ${email} untuk bergabung ke tim ${team.name}.`,
    },
  })

  return NextResponse.json({ success: true, inviteUrl })
}
