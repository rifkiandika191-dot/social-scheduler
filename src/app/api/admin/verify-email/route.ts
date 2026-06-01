import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Verifikasi email manual — pakai saat SMTP belum terkonfigurasi
export async function POST(req: NextRequest) {
  const { secret, email } = await req.json()
  if (secret !== process.env.NEXTAUTH_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return NextResponse.json({ error: 'User tidak ditemukan.' }, { status: 404 })

  await prisma.user.update({
    where: { email },
    data: { emailVerified: true, verificationToken: null, verificationExpiry: null },
  })

  return NextResponse.json({ success: true, message: `Email ${email} berhasil diverifikasi.` })
}
