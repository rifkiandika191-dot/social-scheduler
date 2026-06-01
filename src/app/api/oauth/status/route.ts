import { NextResponse } from 'next/server'

export async function GET() {
  const configured = {
    instagram: !!(process.env.INSTAGRAM_CLIENT_ID || process.env.FACEBOOK_APP_ID),
    facebook:  !!process.env.FACEBOOK_APP_ID,
    twitter:   !!process.env.TWITTER_API_KEY,
    tiktok:    !!process.env.TIKTOK_CLIENT_KEY,
    linkedin:  !!process.env.LINKEDIN_CLIENT_ID,
    youtube:   !!process.env.YOUTUBE_CLIENT_ID,
  }
  return NextResponse.json({ configured })
}
