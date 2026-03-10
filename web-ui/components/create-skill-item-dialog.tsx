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
import { itemApi, type SkillItem, type Organization } from '@/lib/api-client'

const ITEM_TYPES = [
  { value: 'skill', label: 'Skill', description: 'Reusable CLAUDE.md skill instructions' },
  { value: 'subagent', label: 'Subagent', description: 'Specialized AI subagent' },
  { value: 'command', label: 'Command', description: 'Slash command for Claude Code' },
  { value: 'hook', label: 'Hook', description: 'Lifecycle hook (pre/post tool use)' },
  { value: 'mcp', label: 'MCP Server', description: 'Model Context Protocol server' },
]

const CATEGORIES = [
  'developer-tools', 'database', 'file-system', 'cloud-infrastructure',
  'productivity', 'ai-task-management', 'web-search', 'browser-automation',
  'version-control', 'api-development', 'utilities', 'other',
]

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

interface CreateSkillItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  registryId: string
  userId: string
  organizations: Organization[]
  onCreated: (item: SkillItem) => void
}

export function CreateSkillItemDialog({
  open,
  onOpenChange,
  registryId,
  userId,
  organizations,
  onCreated,
}: CreateSkillItemDialogProps) {
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
      setError(err instanceof Error ? err.message : 'Failed to create item')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Skill Item</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Type <span className="text-destructive">*</span></label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {ITEM_TYPES.map(t => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setItemType(t.value)}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    itemType === t.value
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/40 hover:bg-muted/50'
                  }`}
                >
                  <div className="text-sm font-medium">{t.label}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{t.description}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Name <span className="text-destructive">*</span></label>
              <Input
                value={name}
                onChange={e => handleNameChange(e.target.value)}
                placeholder="My Skill"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Slug <span className="text-destructive">*</span></label>
              <Input
                value={slug}
                onChange={e => handleSlugChange(e.target.value)}
                placeholder="my-skill"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Description</label>
            <Input
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Brief description"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Category</label>
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
            <label className="text-sm font-medium">Content</label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder={
                itemType === 'skill' ? '# Skill Instructions\n\nDescribe what this skill does...' :
                itemType === 'command' ? '# Command\n\nDescribe the command behavior...' :
                itemType === 'hook' ? '#!/bin/bash\n# Hook script' :
                'Content...'
              }
              rows={8}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono resize-y focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Visibility</label>
            <Select value={visibility} onValueChange={v => setVisibility(v as 'public' | 'org')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public — visible to everyone</SelectItem>
                <SelectItem value="org">Organization — visible to org members only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {visibility === 'org' && organizations.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Organization</label>
              <Select value={orgId} onValueChange={setOrgId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select organization" />
                </SelectTrigger>
                <SelectContent>
                  {organizations.map(org => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.displayName || org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading || !name.trim() || !slug.trim()}>
              {loading ? 'Creating…' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
