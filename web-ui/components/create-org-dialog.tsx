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
import { orgApi, type Organization } from '@/lib/api-client'
import { useTranslations } from 'next-intl'

interface CreateOrgDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  onCreated: (org: Organization) => void
}

export function CreateOrgDialog({ open, onOpenChange, userId, onCreated }: CreateOrgDialogProps) {
  const t = useTranslations('createOrg')

  const [name, setName] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [description, setDescription] = useState('')
  const [visibility, setVisibility] = useState<'public' | 'private'>('private')
  const [orgType, setOrgType] = useState<'normal' | 'sync'>('normal')

  const [externalUrl, setExternalUrl] = useState('')
  const [externalBranch, setExternalBranch] = useState('main')
  const [syncEnabled, setSyncEnabled] = useState(true)
  const [syncInterval, setSyncInterval] = useState(3600)
  const [includePatterns, setIncludePatterns] = useState('skills/**/SKILL.md\ncommands/**/*.md\nagents/**/*.md\n.claude-plugin/plugin.json\nhooks/hooks.json\n.mcp.json')
  const [excludePatterns, setExcludePatterns] = useState('node_modules/**')
  const [conflictStrategy, setConflictStrategy] = useState<'keep_remote' | 'keep_local'>('keep_remote')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const syncIntervalOptions = [
    { label: t('syncEveryHour'), value: 3600 },
    { label: t('syncEvery6Hours'), value: 21600 },
    { label: t('syncEveryDay'), value: 86400 },
  ]

  const reset = () => {
    setName('')
    setDisplayName('')
    setDescription('')
    setVisibility('private')
    setOrgType('normal')
    setExternalUrl('')
    setExternalBranch('main')
    setSyncEnabled(true)
    setSyncInterval(3600)
    setIncludePatterns('skills/**/SKILL.md\ncommands/**/*.md\nagents/**/*.md\n.claude-plugin/plugin.json\nhooks/hooks.json\n.mcp.json')
    setExcludePatterns('node_modules/**')
    setConflictStrategy('keep_remote')
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    if (orgType === 'sync' && !externalUrl.trim()) {
      setError(t('errorGitUrlRequired'))
      return
    }
    setLoading(true)
    setError('')
    try {
      const payload: Parameters<typeof orgApi.create>[0] = {
        name: name.trim(),
        displayName: displayName.trim() || name.trim(),
        description: description.trim(),
        visibility,
        ownerId: userId,
        orgType,
      }

      if (orgType === 'sync') {
        payload.syncRegistries = [{
          externalUrl: externalUrl.trim(),
          externalBranch: externalBranch.trim() || 'main',
          syncEnabled,
          syncInterval,
          includePatterns: includePatterns.split('\n').map(s => s.trim()).filter(Boolean),
          excludePatterns: excludePatterns.split('\n').map(s => s.trim()).filter(Boolean),
          conflictStrategy,
        }]
      }

      const res = await orgApi.create(payload)
      const org = 'organization' in res ? res.organization : res as Organization
      onCreated(org as Organization)
      onOpenChange(false)
      reset()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errorFailed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset() }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t('labelName')} <span className="text-destructive">*</span></label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={t('placeholderName')}
              required
            />
            <p className="text-xs text-muted-foreground">{t('hintName')}</p>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t('labelDisplayName')}</label>
            <Input
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder={t('placeholderDisplayName')}
            />
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
            <label className="text-sm font-medium">{t('labelVisibility')}</label>
            <Select value={visibility} onValueChange={v => setVisibility(v as 'public' | 'private')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">{t('visibilityPublic')}</SelectItem>
                <SelectItem value="private">{t('visibilityPrivate')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t('labelOrgType')}</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setOrgType('normal')}
                className={`flex-1 px-3 py-2 rounded-md border text-sm transition-colors ${
                  orgType === 'normal'
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border text-muted-foreground hover:border-foreground/30'
                }`}
              >
                {t('orgTypeNormal')}
              </button>
              <button
                type="button"
                onClick={() => setOrgType('sync')}
                className={`flex-1 px-3 py-2 rounded-md border text-sm transition-colors ${
                  orgType === 'sync'
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border text-muted-foreground hover:border-foreground/30'
                }`}
              >
                {t('orgTypeSync')}
              </button>
            </div>
          </div>

          {orgType === 'sync' && (
            <div className="space-y-4 p-4 rounded-lg border border-border bg-muted/20">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t('labelGitUrl')} <span className="text-destructive">*</span></label>
                <Input
                  value={externalUrl}
                  onChange={e => setExternalUrl(e.target.value)}
                  placeholder={t('placeholderGitUrl')}
                  required={orgType === 'sync'}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t('labelBranch')}</label>
                <Input
                  value={externalBranch}
                  onChange={e => setExternalBranch(e.target.value)}
                  placeholder="main"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">{t('labelAutoSync')}</label>
                <input
                  type="checkbox"
                  checked={syncEnabled}
                  onChange={e => setSyncEnabled(e.target.checked)}
                  className="h-4 w-4 rounded border-input accent-primary cursor-pointer"
                />
              </div>
              {syncEnabled && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">{t('labelSyncInterval')}</label>
                  <Select value={String(syncInterval)} onValueChange={v => setSyncInterval(Number(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {syncIntervalOptions.map(opt => (
                        <SelectItem key={opt.value} value={String(opt.value)}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t('labelIncludePatterns')}</label>
                <textarea
                  value={includePatterns}
                  onChange={e => setIncludePatterns(e.target.value)}
                  className="w-full min-h-[100px] px-3 py-2 text-sm rounded-md border border-input bg-background resize-y font-mono"
                  placeholder={"skills/**/SKILL.md\ncommands/**/*.md\nagents/**/*.md\n.claude-plugin/plugin.json\nhooks/hooks.json\n.mcp.json"}
                />
                <p className="text-xs text-muted-foreground">{t('hintIncludePatterns')}</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t('labelExcludePatterns')}</label>
                <textarea
                  value={excludePatterns}
                  onChange={e => setExcludePatterns(e.target.value)}
                  className="w-full min-h-[48px] px-3 py-2 text-sm rounded-md border border-input bg-background resize-y font-mono"
                  placeholder="node_modules/**"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t('labelConflictStrategy')}</label>
                <Select value={conflictStrategy} onValueChange={v => setConflictStrategy(v as 'keep_remote' | 'keep_local')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="keep_remote">{t('conflictKeepRemote')}</SelectItem>
                    <SelectItem value="keep_local">{t('conflictKeepLocal')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>{t('cancel')}</Button>
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading ? t('creating') : t('create')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
