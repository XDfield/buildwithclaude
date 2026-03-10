import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value

  if (!token) {
    return NextResponse.json({ user: null }, { status: 401 })
  }

  const casdoorEndpoint = process.env.NEXT_PUBLIC_CASDOOR_ENDPOINT

  try {
    const userRes = await fetch(`${casdoorEndpoint}/api/userinfo`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!userRes.ok) {
      return NextResponse.json({ user: null }, { status: 401 })
    }

    const user = await userRes.json()
    return NextResponse.json({ user })
  } catch {
    return NextResponse.json({ user: null }, { status: 500 })
  }
}
