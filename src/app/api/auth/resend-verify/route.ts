import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { addHours } from 'date-fns'
import { prisma } from '@/lib/db'
import { sendEmail, verificationEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email) return NextResponse.json({ error: 'Email diperlukan.' }, { status: 400 })

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) return NextResponse.json({ error: 'Email tidak ditemukan.' }, { status: 404 })
    if (user.emailVerified) return NextResponse.json({ error: 'Email sudah terverifikasi.' }, { status: 400 })

    const token = crypto.randomBytes(32).toString('hex')
    await prisma.user.update({
      where: { id: user.id },
      data: { verificationToken: token, verificationExpiry: addHours(new Date(), 24) },
    })

    await sendEmail({
      to: email,
      subject: 'Verifikasi Email — Social Scheduler',
      html: verificationEmail({ name: user.name, token }),
    })

    return NextResponse.json({ message: 'Email verifikasi telah dikirim ulang.' })
  } catch {
    return NextResponse.json({ error: 'Terjadi kesalahan.' }, { status: 500 })
  }
}
