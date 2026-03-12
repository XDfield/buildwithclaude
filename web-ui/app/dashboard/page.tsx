import { cookies } from 'next/headers'
import DashboardClient from './dashboard-client'
import { getLoginUrl } from '@/lib/auth'

export const dynamic = 'force-dynamic'

async function getCurrentUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value
  if (!token) return null
  try {
    const res = await fetch('http://localhost:3000/api/auth/me', {
      headers: { Cookie: `auth_token=${token}` },
      cache: 'no-store',
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.user ?? null
  } catch {
    return null
  }
}

export default async function DashboardPage() {
  const user = await getCurrentUser()
  if (!user) {
    return <DashboardClient user={null} loginUrl={getLoginUrl('/dashboard')} />
  }
  return <DashboardClient user={user} />
}
