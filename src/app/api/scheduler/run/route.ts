import { NextRequest, NextResponse } from 'next/server'
import { processScheduledPosts } from '@/lib/scheduler'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const secret = process.env.NEXTAUTH_SECRET
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const processed = await processScheduledPosts()
  return NextResponse.json({ processed })
}
