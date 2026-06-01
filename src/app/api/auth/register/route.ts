import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/db'

const schema = z.object({
  name:     z.string().min(2).max(100),
  email:    z.string().email(),
  password: z.string().min(6).max(100),
  notRobot: z.literal(true, {
    errorMap: () => ({ message: 'Centang "Saya bukan robot" dulu ya.' }),
  }),
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

    await prisma.user.create({
      data: {
        name,
        email,
        password: hashed,
        emailVerified: true,
      },
    })

    return NextResponse.json({ message: 'Akun dibuat. Silakan masuk.' }, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 })
    }
    console.error(err)
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 })
  }
}
