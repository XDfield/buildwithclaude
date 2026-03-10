export interface CasdoorUser {
  sub: string
  name: string
  preferred_username: string
  email: string
  picture?: string
  owner?: string
}

export function getLoginUrl(redirectTo?: string): string {
  const endpoint = process.env.NEXT_PUBLIC_CASDOOR_ENDPOINT || 'http://localhost:8000'
  const clientId = process.env.NEXT_PUBLIC_CASDOOR_CLIENT_ID || ''
  const appName = process.env.NEXT_PUBLIC_CASDOOR_APP_NAME || 'app-built-in'
  const callbackUrl = `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/api/auth/callback`
  const state = redirectTo ? encodeURIComponent(redirectTo) : encodeURIComponent('/')

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: callbackUrl,
    scope: 'openid profile email',
    state,
  })

  return `${endpoint}/login/oauth/authorize?${params.toString()}&applicationName=${appName}`
}
