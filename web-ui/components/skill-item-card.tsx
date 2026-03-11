'use client'

import { useState } from 'react'
import Link from 'next/link'
import { artifactApi, type SkillItem } from '@/lib/api-client'
import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'
import {
  Sparkles,
  Bot,
  Terminal,
  Server,
  Building2,
  Globe,
  Download,
  Copy,
  Check,
  Tag,
} from 'lucide-react'

const TYPE_ICON: Record<string, React.ElementType> = {
  skill: Sparkles,
  subagent: Bot,
  command: Terminal,
  mcp: Server,
}

const TYPE_COLOR: Record<string, string> = {
  skill: 'text-yellow-500',
  subagent: 'text-blue-500',
  command: 'text-green-500',
  mcp: 'text-purple-500',
}

function installCommand(item: SkillItem) {
  const owner = item.registry?.orgId && item.registry.orgId !== 'public'
    ? item.registry.orgId
    : item.createdBy || 'public'
  return `npx costrict install ${owner}/${item.slug}`
}

interface SkillItemCardProps {
  item: SkillItem
  className?: string
}

export function SkillItemCard({ item, className }: SkillItemCardProps) {
  const [copied, setCopied] = useState(false)
  const t = useTranslations('card')
  const tc = useTranslations('common')

  const Icon = TYPE_ICON[item.itemType] || Sparkles
  const iconColor = TYPE_COLOR[item.itemType] || 'text-muted-foreground'
  const orgName = item.registry?.orgId && item.registry.orgId !== 'public'
    ? item.registry.orgId
    : null
  const latestArtifact = item.artifacts?.find(a => a.isLatest) || item.artifacts?.[0]

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    await navigator.clipboard.writeText(installCommand(item))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  return (
    <Link
      href={`/items/${item.id}`}
      className={cn(
        'group flex flex-col p-4 rounded-lg border border-border bg-card hover:border-primary/40 hover:shadow-sm transition-all',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <Icon className={cn('h-4 w-4 shrink-0', iconColor)} />
          <span className="font-medium text-sm truncate group-hover:text-primary transition-colors">
            {item.name}
          </span>
        </div>
        {item.version && (
          <span className="text-xs text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded shrink-0">
            v{item.version}
          </span>
        )}
      </div>

      {/* Description */}
      {item.description && (
        <p className="text-xs text-muted-foreground line-clamp-2 mb-3 flex-1">
          {item.description}
        </p>
      )}

      {/* Meta row */}
      <div className="flex items-center gap-2 flex-wrap mb-3">
        {item.category && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Tag className="h-3 w-3" />
            {item.category}
          </span>
        )}
        {orgName ? (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Building2 className="h-3 w-3" />
            {orgName}
          </span>
        ) : (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Globe className="h-3 w-3" />
            {tc('public')}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 mt-auto pt-2 border-t border-border/50">
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-1 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          title="Copy install command"
        >
          {copied
            ? <><Check className="h-3 w-3 text-green-500" /><span className="text-green-500">{t('copied')}</span></>
            : <><Copy className="h-3 w-3" /><span>{t('copyInstall')}</span></>
          }
        </button>
        {latestArtifact && (
          <a
            href={artifactApi.downloadUrl(latestArtifact.id)}
            download
            onClick={handleDownload}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors ml-auto"
            title="Download latest artifact"
          >
            <Download className="h-3 w-3" />
            <span>{tc('download')}</span>
          </a>
        )}
      </div>
    </Link>
  )
}
