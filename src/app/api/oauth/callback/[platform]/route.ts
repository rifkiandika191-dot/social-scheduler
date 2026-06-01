import { NextRequest, NextResponse } from 'next/server'
import { OAUTH_CONFIG, type OAuthPlatform } from '@/lib/oauth'
import { prisma } from '@/lib/db'
import { addDays } from 'date-fns'

const BASE = (process.env.NEXTAUTH_URL || 'http://localhost:3000').trim().replace(/\/+$/, '')

export async function GET(req: NextRequest, { params }: { params: { platform: string } }) {
  const platform = params.platform as OAuthPlatform
  const cfg = OAUTH_CONFIG[platform]
  if (!cfg) return NextResponse.redirect(`${BASE}/settings?error=unknown_platform`)

  const { searchParams } = new URL(req.url)
  const code  = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  if (error) return NextResponse.redirect(`${BASE}/settings?error=${error}`)
  if (!code || !state) return NextResponse.redirect(`${BASE}/settings?error=missing_params`)

  // Verifikasi state
  const savedState = req.cookies.get(`oauth_state_${platform}`)?.value
  if (!savedState || savedState !== state) {
    return NextResponse.redirect(`${BASE}/settings?error=invalid_state`)
  }

  const userId = state.split(':')[0]
  if (!userId) return NextResponse.redirect(`${BASE}/settings?error=invalid_state`)

  try {
    // Exchange code → access token
    const tokenRes = await fetch(cfg.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${cfg.clientId}:${cfg.clientSecret}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type:   'authorization_code',
        code,
        redirect_uri:  cfg.callbackUrl,
        client_id:     cfg.clientId,
        client_secret: cfg.clientSecret,
      }).toString(),
    })

    if (!tokenRes.ok) {
      console.error('Token exchange failed:', await tokenRes.text())
      return NextResponse.redirect(`${BASE}/settings?error=token_exchange_failed`)
    }

    const tokenData = await tokenRes.json()
    const accessToken  = tokenData.access_token
    const refreshToken = tokenData.refresh_token
    const expiresIn    = tokenData.expires_in

    // Ambil profil dari platform
    const profileRes = await fetch(cfg.profileUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    let accountName = 'Unknown'
    let accountId   = userId
    let accountImage: string | undefined

    if (profileRes.ok) {
      const profile = await profileRes.json()
      const extracted = extractProfile(platform, profile)
      accountName  = extracted.name
      accountId    = extracted.id
      accountImage = extracted.image
    }

    // Cek jika akun sudah terhubung
    const existing = await prisma.socialAccount.findFirst({
      where: { userId, platform, accountId },
    })

    if (existing) {
      await prisma.socialAccount.update({
        where: { id: existing.id },
        data: {
          accessToken,
          refreshToken: refreshToken || undefined,
          tokenExpiry:  expiresIn ? addDays(new Date(), Math.floor(expiresIn / 86400)) : undefined,
          isActive: true,
        },
      })
    } else {
      await prisma.socialAccount.create({
        data: {
          userId,
          platform,
          accountId,
          accountName,
          accountImage,
          accessToken,
          refreshToken: refreshToken || undefined,
          tokenExpiry:  expiresIn ? addDays(new Date(), Math.floor(expiresIn / 86400)) : undefined,
        },
      })
    }

    const res = NextResponse.redirect(`${BASE}/settings?connected=${platform}`)
    res.cookies.delete(`oauth_state_${platform}`)
    return res
  } catch (err) {
    console.error('OAuth callback error:', err)
    return NextResponse.redirect(`${BASE}/settings?error=callback_failed`)
  }
}

function extractProfile(platform: string, data: any) {
  switch (platform) {
    case 'instagram':
      return { id: data.id, name: `@${data.username}`, image: data.profile_picture_url }
    case 'facebook':
      return { id: data.id, name: data.name, image: data.picture?.data?.url }
    case 'twitter':
      return { id: data.data?.id, name: `@${data.data?.username}`, image: data.data?.profile_image_url }
    case 'tiktok':
      return { id: data.data?.user?.open_id, name: data.data?.user?.display_name, image: data.data?.user?.avatar_url }
    case 'linkedin':
      return {
        id:   data.id,
        name: `${data.localizedFirstName} ${data.localizedLastName}`,
        image: undefined,
      }
    case 'youtube': {
      const ch = data.items?.[0]
      return { id: ch?.id, name: ch?.snippet?.title, image: ch?.snippet?.thumbnails?.default?.url }
    }
    default:
      return { id: 'unknown', name: 'Unknown', image: undefined }
  }
}
