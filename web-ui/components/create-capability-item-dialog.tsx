'use client'

import { useState } from 'react'
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
import { itemApi, type CapabilityItem, type Repository } from '@/lib/api-client'
import { useTranslations } from 'next-intl'

const CATEGORIES = [
  'developer-tools', 'database', 'file-system', 'cloud-infrastructure',
  'productivity', 'ai-task-management', 'web-search', 'browser-automation',
  'version-control', 'api-development', 'utilities', 'other',
]

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

interface CreateCapabilityItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  registryId: string
  userId: string
  repositories: Repository[]
  onCreated: (item: CapabilityItem) => void
}

export function CreateCapabilityItemDialog({
  open,
  onOpenChange,
  registryId,
  userId,
  repositories,
  onCreated,
}: CreateCapabilityItemDialogProps) {
  const t = useTranslations('createCapabilityItem')

  const [itemType, setItemType] = useState('skill')
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugManual, setSlugManual] = useState(false)
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('utilities')
  const [content, setContent] = useState('')
  const [visibility, setVisibility] = useState<'public' | 'org'>('public')
  const [orgId, setOrgId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const itemTypes = [
    { value: 'skill', label: t('typeSkillLabel'), description: t('typeSkillDesc') },
    { value: 'subagent', label: t('typeSubagentLabel'), description: t('typeSubagentDesc') },
    { value: 'command', label: t('typeCommandLabel'), description: t('typeCommandDesc') },
    { value: 'hook', label: t('typeHookLabel'), description: t('typeHookDesc') },
    { value: 'mcp', label: t('typeMcpLabel'), description: t('typeMcpDesc') },
  ]

  const contentPlaceholders: Record<string, string> = {
    skill: '# Skill Instructions\n\nDescribe what this skill does...',
    command: '# Command\n\nDescribe the command behavior...',
    hook: '#!/bin/bash\n# Hook script',
  }

  const handleNameChange = (val: string) => {
    setName(val)
    if (!slugManual) setSlug(slugify(val))
  }

  const handleSlugChange = (val: string) => {
    setSlug(val)
    setSlugManual(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !slug.trim()) return
    setLoading(true)
    setError('')
    try {
      const item = await itemApi.create(registryId, {
        slug: slug.trim(),
        itemType,
        name: name.trim(),
        description: description.trim(),
        category,
        content: content.trim(),
        visibility: visibility === 'org' ? orgId || 'org' : 'public',
        createdBy: userId,
      })
      onCreated(item)
      onOpenChange(false)
      setName('')
      setSlug('')
      setSlugManual(false)
      setDescription('')
      setContent('')
      setVisibility('public')
      setOrgId('')
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errorFailed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t('labelType')} <span className="text-destructive">*</span></label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {itemTypes.map(type => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setItemType(type.value)}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    itemType === type.value
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/40 hover:bg-muted/50'
                  }`}
                >
                  <div className="text-sm font-medium">{type.label}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{type.description}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t('labelName')} <span className="text-destructive">*</span></label>
              <Input
                value={name}
                onChange={e => handleNameChange(e.target.value)}
                placeholder={t('placeholderName')}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t('labelSlug')} <span className="text-destructive">*</span></label>
              <Input
                value={slug}
                onChange={e => handleSlugChange(e.target.value)}
                placeholder={t('placeholderSlug')}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t('labelDescription')}</label>
            <Input
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={t('placeholderDescription')}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t('labelCategory')}</label>
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
            <label className="text-sm font-medium">{t('labelContent')}</label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder={contentPlaceholders[itemType] ?? 'Content...'}
              rows={8}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono resize-y focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t('labelVisibility')}</label>
            <Select value={visibility} onValueChange={v => setVisibility(v as 'public' | 'org')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">{t('visibilityPublic')}</SelectItem>
                <SelectItem value="org">{t('visibilityOrg')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {visibility === 'org' && repositories.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t('labelRepository')}</label>
              <Select value={orgId} onValueChange={setOrgId}>
                <SelectTrigger>
                  <SelectValue placeholder={t('placeholderRepository')} />
                </SelectTrigger>
                <SelectContent>
                  {repositories.map(repo => (
                    <SelectItem key={repo.id} value={repo.id}>
                      {repo.displayName || repo.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>{t('cancel')}</Button>
            <Button type="submit" disabled={loading || !name.trim() || !slug.trim()}>
              {loading ? t('creating') : t('create')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
