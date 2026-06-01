const BASE = (process.env.NEXTAUTH_URL || 'http://localhost:3000').trim().replace(/\/+$/, '')

export const OAUTH_CONFIG = {
  instagram: {
    name:       'Instagram',
    // Instagram disambung lewat Facebook Login (Graph API), via Page yang tertaut.
    authUrl:    'https://www.facebook.com/v18.0/dialog/oauth',
    tokenUrl:   'https://graph.facebook.com/v18.0/oauth/access_token',
    profileUrl: '', // ditangani khusus di callback (lewat Page yang tertaut)
    clientId:     process.env.INSTAGRAM_CLIENT_ID     || process.env.FACEBOOK_APP_ID || '',
    clientSecret: process.env.INSTAGRAM_CLIENT_SECRET || process.env.FACEBOOK_APP_SECRET || '',
    // Izin minimal untuk menyambung akun IG Bisnis. Untuk posting tambahkan:
    // instagram_content_publish,pages_manage_posts (perlu App Review untuk publik).
    scope:       'instagram_basic,pages_show_list',
    callbackUrl: `${BASE}/api/oauth/callback/instagram`,
  },
  facebook: {
    name:       'Facebook',
    authUrl:    'https://www.facebook.com/v18.0/dialog/oauth',
    tokenUrl:   'https://graph.facebook.com/v18.0/oauth/access_token',
    profileUrl: 'https://graph.facebook.com/me?fields=id,name,picture',
    clientId:     process.env.FACEBOOK_APP_ID     || '',
    clientSecret: process.env.FACEBOOK_APP_SECRET || '',
    // Izin dasar agar koneksi berhasil tanpa App Review.
    // Untuk posting ke Page/Instagram, tambahkan kembali setelah lolos App Review:
    // pages_manage_posts,pages_read_engagement,pages_show_list,instagram_basic,instagram_content_publish
    scope:       'public_profile',
    callbackUrl: `${BASE}/api/oauth/callback/facebook`,
  },
  twitter: {
    name:       'Twitter/X',
    authUrl:    'https://twitter.com/i/oauth2/authorize',
    tokenUrl:   'https://api.twitter.com/2/oauth2/token',
    profileUrl: 'https://api.twitter.com/2/users/me?user.fields=profile_image_url',
    clientId:     process.env.TWITTER_API_KEY    || '',
    clientSecret: process.env.TWITTER_API_SECRET || '',
    scope:       'tweet.read tweet.write users.read offline.access',
    callbackUrl: `${BASE}/api/oauth/callback/twitter`,
  },
  tiktok: {
    name:       'TikTok',
    authUrl:    'https://www.tiktok.com/v2/auth/authorize',
    tokenUrl:   'https://open.tiktokapis.com/v2/oauth/token/',
    profileUrl: 'https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name',
    clientId:     process.env.TIKTOK_CLIENT_KEY    || '',
    clientSecret: process.env.TIKTOK_CLIENT_SECRET || '',
    scope:       'user.info.basic,video.publish,video.upload',
    callbackUrl: `${BASE}/api/oauth/callback/tiktok`,
  },
  linkedin: {
    name:       'LinkedIn',
    authUrl:    'https://www.linkedin.com/oauth/v2/authorization',
    tokenUrl:   'https://www.linkedin.com/oauth/v2/accessToken',
    profileUrl: 'https://api.linkedin.com/v2/me?projection=(id,localizedFirstName,localizedLastName,profilePicture(displayImage~:playableStreams))',
    clientId:     process.env.LINKEDIN_CLIENT_ID     || '',
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET || '',
    scope:       'r_liteprofile r_emailaddress w_member_social',
    callbackUrl: `${BASE}/api/oauth/callback/linkedin`,
  },
  youtube: {
    name:       'YouTube',
    authUrl:    'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl:   'https://oauth2.googleapis.com/token',
    profileUrl: 'https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true',
    clientId:     process.env.YOUTUBE_CLIENT_ID     || '',
    clientSecret: process.env.YOUTUBE_CLIENT_SECRET || '',
    scope:       'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly',
    callbackUrl: `${BASE}/api/oauth/callback/youtube`,
  },
} as const

export type OAuthPlatform = keyof typeof OAUTH_CONFIG

export function buildAuthUrl(platform: OAuthPlatform, state: string): string {
  const cfg = OAUTH_CONFIG[platform]
  if (!cfg.clientId) return ''

  const params = new URLSearchParams({
    client_id:     cfg.clientId,
    redirect_uri:  cfg.callbackUrl,
    response_type: 'code',
    scope:         cfg.scope,
    state,
  })

  if (platform === 'twitter') {
    params.set('code_challenge', 'challenge')
    params.set('code_challenge_method', 'plain')
  }

  return `${cfg.authUrl}?${params.toString()}`
}
