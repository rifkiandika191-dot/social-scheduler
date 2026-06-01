import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'File tidak ditemukan.' }, { status: 400 })
    }

    const maxSize = Number(process.env.MAX_FILE_SIZE) || 200 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File terlalu besar. Maks 200MB.' }, { status: 400 })
    }

    const uploadDir = path.join(process.cwd(), 'public', 'uploads')
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    const ext = file.name.split('.').pop() || 'bin'
    const filename = `${uuidv4()}.${ext}`
    const filepath = path.join(uploadDir, filename)

    const bytes = await file.arrayBuffer()
    await writeFile(filepath, Buffer.from(bytes))

    const url = `/uploads/${filename}`
    return NextResponse.json({ url, filename, size: file.size })
  } catch (err) {
    console.error('Upload error:', err)
    return NextResponse.json({ error: 'Gagal mengupload file.' }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
