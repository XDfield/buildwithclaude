import { cookies } from 'next/headers'
import DashboardClient from './dashboard-client'
import Link from 'next/link'
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
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Please log in to access your dashboard</p>
          <a href={getLoginUrl('/dashboard')} className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors">
            Login
          </a>
        </div>
      </div>
    )
  }
  return <DashboardClient user={user} />
}
