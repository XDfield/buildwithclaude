'use client'

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ChevronDown, Globe, Lock, Building2, User, Users } from 'lucide-react'
import { itemApi, orgApi, registryApi, registryApi2, type CapabilityItem, type Organization, type CapabilityRegistry } from '@/lib/api-client'
import { useAuth } from '@/hooks/use-auth'
import { useTranslations } from 'next-intl'

const CATEGORIES = [
  'developer-tools', 'database', 'file-system', 'cloud-infrastructure',
  'productivity', 'ai-task-management', 'web-search', 'browser-automation',
  'version-control', 'api-development', 'utilities', 'other',
]

const TYPE_PREFIX: Record<string, string> = {
  skill: 'skill-',
  subagent: 'agent-',
  command: 'cmd-',
  hook: 'hook-',
  mcp: 'mcp-',
  plugin: 'plugin-',
}

const TYPE_CONTENT_PLACEHOLDER: Record<string, string> = {
  skill: '# Skill Instructions\n\nDescribe what this skill does...',
  subagent: '# Subagent\n\nDescribe the subagent behavior...',
  command: '# Command\n\nDescribe the command behavior...',
  hook: '#!/bin/bash\n# Hook script',
  mcp: '# MCP Server\n\nDescribe the MCP server...',
  plugin: '# Plugin\n\nDescribe the plugin...',
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

interface NamespaceOption {
  value: string
  label: string
  sublabel: string
  kind: 'public' | 'personal' | 'org'
  orgId?: string
  visibility: 'public' | 'private' | 'org'
}

interface ItemCrudDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  itemType: string
  editItem?: CapabilityItem | null
  onSaved: (item: CapabilityItem) => void
}

export function ItemCrudDialog({
  open,
  onOpenChange,
  itemType,
  editItem,
  onSaved,
}: ItemCrudDialogProps) {
  const { user } = useAuth()
  const userId = user?.sub
  const username = user?.preferred_username || user?.name
  const t = useTranslations('crud')

  const [orgs, setOrgs] = useState<Organization[]>([])
  const [orgRegistries, setOrgRegistries] = useState<Record<string, CapabilityRegistry>>({})
  const [personalRegistry, setPersonalRegistry] = useState<CapabilityRegistry | null>(null)
  const [publicRegistry, setPublicRegistry] = useState<CapabilityRegistry | null>(null)

  const [selectedNamespace, setSelectedNamespace] = useState<string>('public')
  const [namespaceOpen, setNamespaceOpen] = useState(false)
  const [packageName, setPackageName] = useState('')
  const [packageNameManual, setPackageNameManual] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('utilities')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isEdit = !!editItem

  useEffect(() => {
    if (!open) return
    registryApi2.getPublic().then(r => setPublicRegistry(r)).catch(() => {})
    if (userId && username) {
      registryApi.ensurePersonal(userId, username).then(r => setPersonalRegistry(r)).catch(() => {})
      orgApi.listMy(userId).then(res => setOrgs(res.organizations || [])).catch(() => {})
    }
  }, [open, userId, username])

  useEffect(() => {
    if (!open || orgs.length === 0) return
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
    for (const org of orgs) {
      if (!orgRegistries[org.id]) {
        fetch(`${API_BASE}/api/organizations/${org.id}/registry`)
          .then(r => r.ok ? r.json() : null)
          .then(data => { if (data) setOrgRegistries(prev => ({ ...prev, [org.id]: data })) })
          .catch(() => {})
      }
    }
  }, [open, orgs])

  useEffect(() => {
    if (editItem) {
      setName(editItem.name)
      setPackageName(editItem.slug)
      setPackageNameManual(true)
      setDescription(editItem.description || '')
      setCategory(editItem.category || 'utilities')
      setContent(editItem.content || '')
    } else {
      setName('')
      setPackageName('')
      setPackageNameManual(false)
      setDescription('')
      setCategory('utilities')
      setContent('')
      setSelectedNamespace('public')
    }
    setError('')
  }, [editItem, open])

  const namespaceOptions = useMemo<NamespaceOption[]>(() => {
    const opts: NamespaceOption[] = [
      {
        value: 'public',
        label: 'public',
        sublabel: t('publicNamespace'),
        kind: 'public',
        visibility: 'public',
      },
    ]
    if (userId && username) {
      opts.push({
        value: `@${username}`,
        label: `@${username}`,
        sublabel: t('personalNamespace'),
        kind: 'personal',
        visibility: 'private',
      })
    }
    for (const org of orgs) {
      opts.push({
        value: `@${org.name}`,
        label: `@${org.name}`,
        sublabel: org.displayName || org.description || t('orgNamespace'),
        kind: 'org',
        orgId: org.id,
        visibility: org.visibility === 'public' ? 'public' : 'org',
      })
    }
    return opts
  }, [userId, username, orgs, t])

  const prefix = TYPE_PREFIX[itemType] || ''
  const selectedOption = namespaceOptions.find(o => o.value === selectedNamespace)

  const handleNameChange = (val: string) => {
    setName(val)
    if (!packageNameManual) {
      setPackageName(prefix + slugify(val))
    }
  }

  const handlePackageNameChange = (val: string) => {
    setPackageName(val)
    setPackageNameManual(true)
  }

  const resolveRegistryId = (): string | undefined => {
    if (selectedNamespace === 'public') return publicRegistry?.id
    if (selectedNamespace === `@${username}`) return personalRegistry?.id
    const opt = namespaceOptions.find(o => o.value === selectedNamespace && o.kind === 'org')
    if (opt?.orgId) return orgRegistries[opt.orgId]?.id
    return undefined
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || (!isEdit && !packageName.trim())) return
    setLoading(true)
    setError('')
    try {
      let item: CapabilityItem
      const visibility = selectedOption?.visibility || 'public'
      if (isEdit && editItem) {
        item = await itemApi.update(editItem.id, {
          name: name.trim(),
          description: description.trim(),
          category,
          content: content.trim(),
          visibility,
        })
      } else {
        const registryId = resolveRegistryId()
        item = await itemApi.createDirect({
          itemType,
          name: name.trim(),
          description: description.trim(),
          category,
          content: content.trim(),
          visibility,
          registryId,
          slug: packageName.trim(),
          createdBy: userId,
        })
      }
      onSaved(item)
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('failedToSave'))
    } finally {
      setLoading(false)
    }
  }

  const typeLabel = itemType === 'mcp' ? 'MCP Server' : itemType.charAt(0).toUpperCase() + itemType.slice(1)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? t('editTitle', { type: typeLabel }) : t('createTitle', { type: typeLabel })}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-2">

          {!isEdit && (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t('ownerPackage')} <span className="text-destructive">*</span>
              </label>
              <div className="flex items-stretch gap-1.5">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setNamespaceOpen(v => !v)}
                    className="flex items-center gap-1.5 h-9 px-3 rounded-md border border-input bg-background text-sm hover:bg-muted/50 transition-colors whitespace-nowrap"
                  >
                    {selectedOption?.kind === 'public' && <Globe className="h-3.5 w-3.5 text-muted-foreground" />}
                    {selectedOption?.kind === 'personal' && <User className="h-3.5 w-3.5 text-muted-foreground" />}
                    {selectedOption?.kind === 'org' && <Building2 className="h-3.5 w-3.5 text-muted-foreground" />}
                    <span>{selectedOption?.label ?? 'public'}</span>
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>

                  {namespaceOpen && (
                    <div className="absolute top-full left-0 mt-1 z-50 w-64 rounded-md border border-border bg-popover shadow-md py-1">
                      {namespaceOptions.map(opt => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => { setSelectedNamespace(opt.value); setNamespaceOpen(false) }}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-muted/50 transition-colors flex items-start gap-2.5 ${selectedNamespace === opt.value ? 'bg-muted/30' : ''}`}
                        >
                          <span className="mt-0.5 shrink-0">
                            {opt.kind === 'public' && <Globe className="h-4 w-4 text-muted-foreground" />}
                            {opt.kind === 'personal' && <User className="h-4 w-4 text-muted-foreground" />}
                            {opt.kind === 'org' && <Building2 className="h-4 w-4 text-muted-foreground" />}
                          </span>
                          <span>
                            <span className="font-medium block">{opt.label}</span>
                            <span className="text-xs text-muted-foreground">{opt.sublabel}</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <span className="flex items-center text-muted-foreground text-lg select-none">/</span>

                <Input
                  value={packageName}
                  onChange={e => handlePackageNameChange(e.target.value)}
                  placeholder={`${prefix}my-${itemType}`}
                  className="flex-1"
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {t('fullIdentifier')}{' '}
                <code className="font-mono">{selectedOption?.label ?? 'public'}/{packageName || `${prefix}my-${itemType}`}</code>
              </p>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              {t('displayName')} <span className="text-destructive">*</span>
            </label>
            <Input
              value={name}
              onChange={e => handleNameChange(e.target.value)}
              placeholder={`My ${typeLabel}`}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t('description')}</label>
            <Input
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={t('descriptionPlaceholder')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t('category')}</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => (
                    <SelectItem key={c} value={c}>
                      {c.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t('visibility')}</label>
              <div className="flex items-center gap-1.5 h-9 px-3 rounded-md border border-input bg-muted/30 text-sm text-muted-foreground">
                {selectedOption?.visibility === 'public' && <><Globe className="h-3.5 w-3.5" /> {t('visibilityPublic')}</>}
                {selectedOption?.visibility === 'org' && <><Users className="h-3.5 w-3.5" /> {t('visibilityOrg')}</>}
                {selectedOption?.visibility === 'private' && <><Lock className="h-3.5 w-3.5" /> {t('visibilityPrivate')}</>}
              </div>
              <p className="text-xs text-muted-foreground">{t('visibilityHint')}</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t('content')}</label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder={TYPE_CONTENT_PLACEHOLDER[itemType] || 'Content...'}
              rows={6}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono resize-y focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>{t('cancel')}</Button>
            <Button type="submit" disabled={loading || !name.trim() || (!isEdit && !packageName.trim())}>
              {loading ? (isEdit ? t('saving') : t('creating')) : (isEdit ? t('saveChanges') : t('create', { type: typeLabel }))}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
