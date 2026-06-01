import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendEmail, welcomeEmail } from '@/lib/email'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) {
    return NextResponse.redirect(new URL('/verify/invalid', req.url))
  }

  const user = await prisma.user.findUnique({ where: { verificationToken: token } })

  if (!user) {
    return NextResponse.redirect(new URL('/verify/invalid', req.url))
  }

  if (user.verificationExpiry && user.verificationExpiry < new Date()) {
    return NextResponse.redirect(new URL('/verify/expired', req.url))
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: true, verificationToken: null, verificationExpiry: null },
  })

  await sendEmail({
    to: user.email,
    subject: 'Selamat datang di Social Scheduler!',
    html: welcomeEmail({ name: user.name }),
  })

  return NextResponse.redirect(new URL('/login?verified=1', req.url))
}
