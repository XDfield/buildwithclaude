'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { itemApi, artifactApi, type CapabilityItem, type CapabilityArtifact } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useTranslations } from 'next-intl'
import {
  ArrowLeft,
  Download,
  Copy,
  Check,
  Sparkles,
  Bot,
  Terminal,
  Server,
  Building2,
  Globe,
  FileArchive,
  Loader2,
  Tag,
  Clock,
  User,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const TYPE_ICONS: Record<string, { icon: React.ElementType; color: string; backHref: string }> = {
  skill:    { icon: Sparkles, color: 'text-yellow-500', backHref: '/skills' },
  subagent: { icon: Bot,      color: 'text-blue-500',   backHref: '/subagents' },
  command:  { icon: Terminal, color: 'text-green-500',  backHref: '/commands' },
  mcp:      { icon: Server,   color: 'text-purple-500', backHref: '/mcp-servers' },
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' })
}

function installCommand(item: CapabilityItem) {
  const owner = item.registry?.orgId && item.registry.orgId !== 'public'
    ? item.registry.orgId
    : item.createdBy || 'public'
  return `npx costrict install ${owner}/${item.slug}`
}

function renderMarkdown(content: string) {
  return content.split('\n').map((line, i) => {
    if (line.startsWith('# '))   return <h1 key={i} className="text-2xl font-semibold mt-6 mb-3">{line.slice(2)}</h1>
    if (line.startsWith('## '))  return <h2 key={i} className="text-xl font-medium mt-5 mb-2">{line.slice(3)}</h2>
    if (line.startsWith('### ')) return <h3 key={i} className="text-base font-medium mt-4 mb-2">{line.slice(4)}</h3>
    if (line.startsWith('- '))   return <li key={i} className="ml-5 list-disc mb-1">{line.slice(2)}</li>
    if (/^\d+\. /.test(line))    return <li key={i} className="ml-5 list-decimal mb-1">{line.replace(/^\d+\. /, '')}</li>
    if (line.startsWith('```'))  return <div key={i} className="font-mono text-xs bg-muted/60 px-3 py-1 rounded my-1">{line}</div>
    if (line.includes('`')) {
      const parts = line.split('`')
      return (
        <p key={i} className="mb-2 leading-relaxed">
          {parts.map((p, j) => j % 2 === 0 ? p : <code key={j} className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">{p}</code>)}
        </p>
      )
    }
    if (line.trim()) return <p key={i} className="mb-2 leading-relaxed">{line}</p>
    return <br key={i} />
  })
}

export default function ItemDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [item, setItem] = useState<CapabilityItem | null>(null)
  const [artifacts, setArtifacts] = useState<CapabilityArtifact[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedCmd, setCopiedCmd] = useState(false)
  const [copiedArtifact, setCopiedArtifact] = useState<string | null>(null)
  const t = useTranslations('itemDetail')
  const tc = useTranslations('common')
  const ts = useTranslations('skills')
  const tsa = useTranslations('subagents')
  const tco = useTranslations('commands')
  const tm = useTranslations('mcp')

  useEffect(() => {
    if (!id) return
    Promise.all([itemApi.get(id), artifactApi.list(id)])
      .then(([itemData, artifactData]) => {
        setItem(itemData)
        setArtifacts(artifactData.artifacts || [])
      })
      .catch(() => setItem(null))
      .finally(() => setLoading(false))
  }, [id])

  const handleCopyCmd = async () => {
    if (!item) return
    await navigator.clipboard.writeText(installCommand(item))
    setCopiedCmd(true)
    setTimeout(() => setCopiedCmd(false), 2000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!item) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-muted-foreground">{t('notFound')}</p>
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-1.5" /> {tc('back')}
        </Button>
      </div>
    )
  }

  const typeLabels: Record<string, string> = {
    skill: ts('title').replace(/s$/, ''),
    subagent: tsa('title').replace(/s$/, ''),
    command: tco('title').replace(/s$/, ''),
    mcp: 'MCP Server',
  }
  const typeBackLabels: Record<string, string> = {
    skill: ts('backTo'),
    subagent: tsa('backTo'),
    command: tco('backTo'),
    mcp: tm('backTo'),
  }
  const typeContentLabels: Record<string, string> = {
    skill: ts('instructions'),
    subagent: tsa('systemPrompt'),
    command: tco('instructions'),
    mcp: tm('content'),
  }

  const meta = TYPE_ICONS[item.itemType] || TYPE_ICONS.skill
  const Icon = meta.icon
  const typeLabel = typeLabels[item.itemType] || item.itemType
  const backLabel = typeBackLabels[item.itemType] || tc('back')
  const contentLabel = typeContentLabels[item.itemType] || tm('content')
  const orgName = item.registry?.orgId && item.registry.orgId !== 'public' ? item.registry.orgId : null
  const latestArtifact = artifacts.find(a => a.isLatest) || artifacts[0]

  return (
    <div className="min-h-screen">
      <div className="px-8 py-10 max-w-4xl">

        {/* Back */}
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
        </button>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <Icon className={cn('h-8 w-8 shrink-0', meta.color)} />
              <h1 className="text-display-2">{item.name}</h1>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button size="sm" variant="ghost" onClick={handleCopyCmd} title="Copy install command">
                {copiedCmd ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
              {latestArtifact && (
                <a href={artifactApi.downloadUrl(latestArtifact.id)} download>
                  <Button size="sm" variant="ghost" title="Download">
                    <Download className="h-4 w-4" />
                  </Button>
                </a>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Badge variant="secondary">{typeLabel}</Badge>
            {item.version && <Badge variant="outline">v{item.version}</Badge>}
            {item.category && (
              <Badge variant="outline" className="gap-1">
                <Tag className="h-3 w-3" />{item.category}
              </Badge>
            )}
            {orgName ? (
              <Badge variant="outline" className="gap-1">
                <Building2 className="h-3 w-3" />{orgName}
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1">
                <Globe className="h-3 w-3" />{tc('public')}
              </Badge>
            )}
          </div>

          {item.description && (
            <p className="text-lg text-muted-foreground">{item.description}</p>
          )}
        </div>

        {/* Install command box */}
        <div className="mb-10 p-4 bg-card rounded-lg border border-border flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground mb-1 font-medium">{t('quickInstall')}</p>
            <code className="text-sm font-mono text-foreground/90">{installCommand(item)}</code>
          </div>
          <Button size="sm" variant="ghost" onClick={handleCopyCmd} className="shrink-0">
            {copiedCmd ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="md:col-span-2 space-y-8">

            {item.content && (
              <section>
                <h2 className="text-lg font-medium mb-4">
                  {contentLabel}
                </h2>
                <div className="bg-card rounded-lg p-6 border border-border prose prose-sm max-w-none text-sm leading-relaxed">
                  {renderMarkdown(item.content)}
                </div>
              </section>
            )}

            {artifacts.length > 0 && (
              <section>
                <h2 className="text-lg font-medium mb-4">{t('artifacts')}</h2>
                <div className="space-y-2">
                  {artifacts.map(artifact => (
                    <div key={artifact.id} className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border bg-card">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FileArchive className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">{artifact.filename}</div>
                          <div className="text-xs text-muted-foreground">
                            v{artifact.version} · {formatBytes(artifact.fileSize)} · {artifact.downloadCount} {t('downloads')}
                            {artifact.isLatest && <span className="ml-1.5 text-primary font-medium">{t('latest')}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          size="sm" variant="ghost"
                          onClick={async () => {
                            await navigator.clipboard.writeText(artifactApi.downloadUrl(artifact.id))
                            setCopiedArtifact(artifact.id)
                            setTimeout(() => setCopiedArtifact(null), 2000)
                          }}
                        >
                          {copiedArtifact === artifact.id ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                        </Button>
                        <a href={artifactApi.downloadUrl(artifact.id)} download>
                          <Button size="sm" variant="ghost"><Download className="h-3.5 w-3.5" /></Button>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="p-4 rounded-lg border border-border bg-card space-y-3">
              <h3 className="text-sm font-medium">{t('details')}</h3>
              <dl className="space-y-2.5 text-sm">
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">{tc('type')}</dt>
                  <dd className="font-medium">{typeLabel}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">{tc('visibility')}</dt>
                  <dd className="capitalize">{item.visibility}</dd>
                </div>
                {item.createdBy && (
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground flex items-center gap-1"><User className="h-3 w-3" />{tc('author')}</dt>
                    <dd className="truncate max-w-[120px]">{item.createdBy}</dd>
                  </div>
                )}
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{tc('created')}</dt>
                  <dd>{formatDate(item.createdAt)}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{tc('updated')}</dt>
                  <dd>{formatDate(item.updatedAt)}</dd>
                </div>
              </dl>
            </div>

            {item.registry && (
              <div className="p-4 rounded-lg border border-border bg-card space-y-3">
                <h3 className="text-sm font-medium">{t('registry')}</h3>
                <dl className="space-y-2.5 text-sm">
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">{tc('name')}</dt>
                    <dd className="truncate max-w-[140px]">{item.registry.name}</dd>
                  </div>
                  {orgName && (
                    <div className="flex justify-between gap-2">
                      <dt className="text-muted-foreground flex items-center gap-1"><Building2 className="h-3 w-3" />{tc('org')}</dt>
                      <dd className="truncate max-w-[140px]">{orgName}</dd>
                    </div>
                  )}
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">{tc('visibility')}</dt>
                    <dd className="capitalize">{item.registry.visibility}</dd>
                  </div>
                </dl>
              </div>
            )}

            <Button variant="outline" className="w-full justify-start gap-2" onClick={() => router.push(meta.backHref)}>
              {t('browseMore', { type: typeLabel })}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
