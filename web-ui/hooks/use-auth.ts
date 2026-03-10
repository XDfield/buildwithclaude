'use client'

import { useState, useEffect } from 'react'
import { CasdoorUser } from '@/lib/auth'

interface AuthState {
  user: CasdoorUser | null
  loading: boolean
}

export function useAuth(): AuthState & { logout: () => Promise<void> } {
  const [state, setState] = useState<AuthState>({ user: null, loading: true })

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => setState({ user: data.user, loading: false }))
      .catch(() => setState({ user: null, loading: false }))
  }, [])

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    setState({ user: null, loading: false })
    window.location.href = '/'
  }

  return { ...state, logout }
}
