'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { getLoginUrl } from '@/lib/auth'
import { cn } from '@/lib/utils'
import { Store, LogIn, LogOut, LayoutDashboard, ChevronDown } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { LocaleSwitcher } from '@/components/locale-switcher'

export function Topbar() {
  const pathname = usePathname()
  const { user, loading, logout } = useAuth()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const t = useTranslations('nav')
  const tc = useTranslations('common')

  const TOP_NAV = [
    { href: '/skills', label: t('skillStore'), icon: Store },
  ]

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <header className="fixed top-0 left-60 right-0 z-30 h-12 flex items-center justify-between px-6 border-b border-border bg-background/95 backdrop-blur-sm">
      <nav className="flex items-center gap-1">
        {TOP_NAV.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors',
              pathname.startsWith(item.href)
                ? 'text-primary bg-primary/10 font-medium'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            )}
          >
            <item.icon className="h-3.5 w-3.5" />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="flex items-center gap-2">
        <LocaleSwitcher />
        {!loading && (
          user ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setUserMenuOpen(v => !v)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                <span className="max-w-[140px] truncate">{user.preferred_username || user.name}</span>
                <ChevronDown className="h-3 w-3 shrink-0" />
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-1 z-50 min-w-[160px] rounded-md border border-border bg-popover shadow-md py-1">
                  <Link
                    href="/dashboard"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                  >
                    <LayoutDashboard className="h-3.5 w-3.5" />
                    {tc('dashboard')}
                  </Link>
                  <button
                    onClick={() => { setUserMenuOpen(false); logout() }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    {tc('logout')}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <a
              href={getLoginUrl(pathname)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <LogIn className="h-3.5 w-3.5" />
              {tc('login')}
            </a>
          )
        )}
      </div>
    </header>
  )
}
