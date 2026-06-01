import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { addHours } from 'date-fns'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { sendEmail, verificationEmail } from '@/lib/email'

const schema = z.object({
  name:     z.string().min(2).max(100),
  email:    z.string().email(),
  password: z.string().min(6).max(100),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, password } = schema.parse(body)

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'Email sudah terdaftar.' }, { status: 400 })
    }

    const hashed = await bcrypt.hash(password, 12)
    const token  = crypto.randomBytes(32).toString('hex')

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashed,
        emailVerified: false,
        verificationToken:  token,
        verificationExpiry: addHours(new Date(), 24),
      },
    })

    await sendEmail({
      to: email,
      subject: 'Verifikasi Email — Social Scheduler',
      html: verificationEmail({ name, token }),
    })

    return NextResponse.json({ message: 'Akun dibuat. Cek email Anda untuk verifikasi.' }, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 })
    }
    console.error(err)
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 })
  }
}
