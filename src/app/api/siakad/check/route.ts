import { NextRequest, NextResponse } from 'next/server'
import { runSiakadCheck } from '@/lib/siakad'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Endpoint cron untuk memonitor status open/close perkuliahan di SIAKAD.
// Panggil berkala (mis. tiap 1 menit) dengan header:
//   Authorization: Bearer <NEXTAUTH_SECRET>
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const secret = process.env.SIAKAD_CRON_SECRET || process.env.NEXTAUTH_SECRET
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await runSiakadCheck()
  return NextResponse.json(result, { status: result.ok ? 200 : 502 })
}
