'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'
import { useOrgFilter } from '@/lib/org-filter-context'
import { orgApi, type Organization } from '@/lib/api-client'
import { useTranslations } from 'next-intl'
import {
  Sparkles,
  Bot,
  Terminal,
  Server,
  Building2,
  Globe,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'

function NavItem({
  href,
  label,
  icon: Icon,
  active,
  indent = false,
}: {
  href: string
  label: string
  icon: React.ElementType
  active: boolean
  indent?: boolean
}) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors',
        indent && 'ml-3',
        active
          ? 'bg-primary/10 text-primary font-medium'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="truncate">{label}</span>
    </Link>
  )
}

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAuth()
  const { selectedOrg, setSelectedOrg } = useOrgFilter()
  const [orgs, setOrgs] = useState<Organization[]>([])
  const [orgsExpanded, setOrgsExpanded] = useState(true)
  const t = useTranslations('nav')
  const ts = useTranslations('skills')
  const tsa = useTranslations('subagents')
  const tc = useTranslations('commands')
  const tm = useTranslations('mcp')

  const NAV_ITEMS = [
    { href: '/skills', label: ts('title'), icon: Sparkles },
    { href: '/subagents', label: tsa('title'), icon: Bot },
    { href: '/commands', label: tc('title'), icon: Terminal },
    { href: '/mcp-servers', label: tm('title'), icon: Server },
  ]

  useEffect(() => {
    if (user?.sub) {
      orgApi.listMy(user.sub)
        .then(res => setOrgs(res.organizations || []))
        .catch(() => {})
    } else {
      setOrgs([])
    }
  }, [user?.sub])

  const handleSelectOrg = (org: Organization | null) => {
    setSelectedOrg(org)
    if (org) {
      const current = NAV_ITEMS.find(n => pathname.startsWith(n.href))
      if (current) {
        router.push(current.href)
      } else {
        router.push('/skills')
      }
    }
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-border bg-background">
      <div className="flex h-12 items-center px-4 border-b border-border shrink-0">
        <Link href="/" className="font-semibold text-foreground hover:text-primary transition-colors text-sm">
          {t('brand')}
        </Link>
      </div>

      <div className="flex flex-col flex-1 overflow-y-auto py-3 gap-1 px-2">

        <div className="mb-1">
          <p className="px-3 py-1 text-xs font-medium text-muted-foreground/60 uppercase tracking-wider">
            {t('explore')}
          </p>
          {NAV_ITEMS.map(item => (
            <NavItem
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              active={!selectedOrg && pathname === item.href}
            />
          ))}
        </div>

        {user && (
          <div className="mt-2">
            <button
              onClick={() => setOrgsExpanded(v => !v)}
              className="w-full flex items-center justify-between px-3 py-1 text-xs font-medium text-muted-foreground/60 uppercase tracking-wider hover:text-muted-foreground transition-colors"
            >
              <span>{t('organizations')}</span>
              {orgsExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </button>

            {orgsExpanded && (
              <div className="mt-0.5 space-y-0.5">
                <button
                  onClick={() => handleSelectOrg(null)}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors',
                    !selectedOrg
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  )}
                >
                  <Globe className="h-4 w-4 shrink-0" />
                  <span className="truncate">{t('allPublic')}</span>
                </button>

                {orgs.map(org => (
                  <div key={org.id}>
                    <button
                      onClick={() => handleSelectOrg(org)}
                      className={cn(
                        'w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors',
                        selectedOrg?.id === org.id
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                      )}
                    >
                      <Building2 className="h-4 w-4 shrink-0" />
                      <span className="truncate flex-1 text-left">{org.displayName || org.name}</span>
                    </button>

                    {selectedOrg?.id === org.id && (
                      <div className="mt-0.5 space-y-0.5">
                        {NAV_ITEMS.map(item => (
                          <NavItem
                            key={item.href}
                            href={item.href}
                            label={item.label}
                            icon={item.icon}
                            active={pathname === item.href}
                            indent
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {orgs.length === 0 && (
                  <p className="px-3 py-2 text-xs text-muted-foreground">{t('noOrgs')}</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

    </aside>
  )
}
