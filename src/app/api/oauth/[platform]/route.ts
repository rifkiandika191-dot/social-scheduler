import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { buildAuthUrl, OAUTH_CONFIG, type OAuthPlatform } from '@/lib/oauth'
import crypto from 'crypto'

export async function GET(req: NextRequest, { params }: { params: { platform: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const platform = params.platform as OAuthPlatform
  if (!OAUTH_CONFIG[platform]) {
    return NextResponse.json({ error: 'Platform tidak dikenal.' }, { status: 400 })
  }

  const cfg = OAUTH_CONFIG[platform]
  if (!cfg.clientId) {
    return NextResponse.json({
      error: `API key ${platform} belum dikonfigurasi. Tambahkan di file .env`,
      platform,
      envKey: getEnvKey(platform),
    }, { status: 400 })
  }

  // Simpan state di cookie untuk verifikasi saat callback
  const state = `${session.user.id}:${crypto.randomBytes(16).toString('hex')}`
  const authUrl = buildAuthUrl(platform, state)

  const res = NextResponse.redirect(authUrl)
  res.cookies.set(`oauth_state_${platform}`, state, {
    httpOnly: true, secure: false, maxAge: 600, path: '/',
  })
  return res
}

function getEnvKey(platform: string): Record<string, string[]> {
  const map: Record<string, string[]> = {
    instagram: ['INSTAGRAM_CLIENT_ID', 'INSTAGRAM_CLIENT_SECRET'],
    facebook:  ['FACEBOOK_APP_ID', 'FACEBOOK_APP_SECRET'],
    twitter:   ['TWITTER_API_KEY', 'TWITTER_API_SECRET'],
    tiktok:    ['TIKTOK_CLIENT_KEY', 'TIKTOK_CLIENT_SECRET'],
    linkedin:  ['LINKEDIN_CLIENT_ID', 'LINKEDIN_CLIENT_SECRET'],
    youtube:   ['YOUTUBE_CLIENT_ID', 'YOUTUBE_CLIENT_SECRET'],
  }
  return { [platform]: map[platform] || [] }
}
