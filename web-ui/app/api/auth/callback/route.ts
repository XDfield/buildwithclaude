import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')

  if (!code) {
    return NextResponse.redirect(new URL('/?error=no_code', request.url))
  }

  const casdoorEndpoint = process.env.NEXT_PUBLIC_CASDOOR_ENDPOINT
  const clientId = process.env.NEXT_PUBLIC_CASDOOR_CLIENT_ID
  const clientSecret = process.env.CASDOOR_CLIENT_SECRET

  try {
    const tokenRes = await fetch(`${casdoorEndpoint}/api/login/oauth/access_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000'}/api/auth/callback`,
      }),
    })

    if (!tokenRes.ok) {
      return NextResponse.redirect(new URL('/?error=token_failed', request.url))
    }

    const tokenData = await tokenRes.json()
    const accessToken = tokenData.access_token

    if (!accessToken) {
      return NextResponse.redirect(new URL('/?error=no_token', request.url))
    }

    const redirectTo = state ? decodeURIComponent(state) : '/'
    const response = NextResponse.redirect(new URL(redirectTo, request.url))

    response.cookies.set('auth_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    return response
  } catch {
    return NextResponse.redirect(new URL('/?error=auth_failed', request.url))
  }
}
