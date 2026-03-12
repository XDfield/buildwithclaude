'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  orgRegistryApi,
  syncApi,
  type SyncLog,
  type CapabilityRegistry,
  type CreateSyncRegistryInput,
} from '@/lib/api-client'
import {
  RefreshCw, Play, Square, GitBranch, Clock, CheckCircle2,
  XCircle, Loader2, Plus, Trash2, ChevronDown, ChevronRight,
} from 'lucide-react'

interface OrgSyncTabProps {
  orgId: string
}

const SYNC_INTERVAL_OPTIONS = [
  { label: 'Every hour', value: 3600 },
  { label: 'Every 6 hours', value: 21600 },
  { label: 'Every day', value: 86400 },
]

const DEFAULT_INCLUDE_PATTERNS = 'skills/**/SKILL.md\ncommands/**/*.md\nagents/**/*.md\n.claude-plugin/plugin.json\nhooks/hooks.json\n.mcp.json'

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { cls: string; label: string }> = {
    idle: { cls: 'bg-muted text-muted-foreground', label: 'Idle' },
    syncing: { cls: 'bg-blue-500/10 text-blue-500', label: 'Syncing' },
    error: { cls: 'bg-destructive/10 text-destructive', label: 'Error' },
    paused: { cls: 'bg-yellow-500/10 text-yellow-600', label: 'Paused' },
    running: { cls: 'bg-blue-500/10 text-blue-500', label: 'Running' },
    success: { cls: 'bg-green-500/10 text-green-600', label: 'Success' },
    failed: { cls: 'bg-destructive/10 text-destructive', label: 'Failed' },
    cancelled: { cls: 'bg-muted text-muted-foreground', label: 'Cancelled' },
    pending: { cls: 'bg-yellow-500/10 text-yellow-600', label: 'Pending' },
  }
  const s = map[status] ?? { cls: 'bg-muted text-muted-foreground', label: status }
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.cls}`}>{s.label}</span>
}

function formatDuration(ms: number) {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`
}

function formatDate(iso?: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString()
}

interface RegistryFormState {
  name: string
  externalUrl: string
  externalBranch: string
  syncEnabled: boolean
  syncInterval: number
  includePatterns: string
  excludePatterns: string
  conflictStrategy: string
}

function defaultForm(reg?: CapabilityRegistry): RegistryFormState {
  const cfg = reg?.syncConfig as Record<string, unknown> | undefined
  return {
    name: reg?.name ?? '',
    externalUrl: reg?.externalUrl ?? '',
    externalBranch: reg?.externalBranch ?? 'main',
    syncEnabled: reg?.syncEnabled ?? false,
    syncInterval: reg?.syncInterval ?? 3600,
    includePatterns: (cfg?.includePatterns as string[] | undefined)?.join('\n') ?? '',
    excludePatterns: (cfg?.excludePatterns as string[] | undefined)?.join('\n') ?? '',
    conflictStrategy: (cfg?.conflictStrategy as string | undefined) ?? 'keep_remote',
  }
}

interface RegistryCardProps {
  orgId: string
  registry: CapabilityRegistry
  onRemoved: () => void
  onUpdated: () => void
}

function RegistryCard({ orgId, registry, onRemoved, onUpdated }: RegistryCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [form, setForm] = useState<RegistryFormState>(() => defaultForm(registry))
  const [logs, setLogs] = useState<SyncLog[]>([])
  const [logsLoaded, setLogsLoaded] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [syncStatus, setSyncStatus] = useState(registry.syncStatus)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const loadLogs = useCallback(async () => {
    try {
      const res = await syncApi.listOrgSyncLogs(orgId, 1, 10, registry.id)
      setLogs(res.logs ?? [])
    } catch {}
  }, [orgId, registry.id])

  useEffect(() => {
    if (expanded && !logsLoaded) {
      loadLogs()
      setLogsLoaded(true)
    }
  }, [expanded, logsLoaded, loadLogs])

  useEffect(() => {
    if (syncStatus === 'syncing') {
      const t = setInterval(async () => {
        try {
          const res = await syncApi.getOrgSyncStatus(orgId, registry.id) as { syncStatus: string }
          setSyncStatus(res.syncStatus)
          if (res.syncStatus !== 'syncing') {
            loadLogs()
            onUpdated()
          }
        } catch {}
      }, 3000)
      return () => clearInterval(t)
    }
  }, [syncStatus, orgId, registry.id, loadLogs, onUpdated])

  const handleSync = async () => {
    setSyncing(true)
    setError('')
    try {
      await syncApi.triggerOrgSync(orgId, false, registry.id)
      setSyncStatus('syncing')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to trigger sync')
    } finally {
      setSyncing(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSuccessMsg('')
    try {
      await orgRegistryApi.update(orgId, registry.id, {
        name: form.name,
        externalUrl: form.externalUrl,
        externalBranch: form.externalBranch,
        syncEnabled: form.syncEnabled,
        syncInterval: form.syncInterval,
        includePatterns: form.includePatterns.split('\n').map(s => s.trim()).filter(Boolean),
        excludePatterns: form.excludePatterns.split('\n').map(s => s.trim()).filter(Boolean),
        conflictStrategy: form.conflictStrategy,
      })
      setSuccessMsg('Saved')
      setTimeout(() => setSuccessMsg(''), 3000)
      onUpdated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleRemove = async () => {
    if (!confirm(`Remove registry "${registry.name || registry.externalUrl}"?`)) return
    setRemoving(true)
    try {
      await orgRegistryApi.remove(orgId, registry.id)
      onRemoved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove')
      setRemoving(false)
    }
  }

  const set = (k: keyof RegistryFormState) => (v: string | boolean | number) =>
    setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="rounded-lg border border-border bg-card">
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer select-none"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center gap-2 min-w-0">
          {expanded ? <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
          <GitBranch className="h-4 w-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0">
            <div className="text-sm font-medium truncate">{registry.name || registry.externalUrl}</div>
            {registry.name && <div className="text-xs text-muted-foreground truncate">{registry.externalUrl}</div>}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          <StatusBadge status={syncStatus} />
          <Button
            variant="ghost" size="sm" className="h-7 w-7 p-0"
            onClick={e => { e.stopPropagation(); handleSync() }}
            disabled={syncing || syncStatus === 'syncing'}
            title="Sync now"
          >
            {syncing || syncStatus === 'syncing'
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <Play className="h-3.5 w-3.5" />}
          </Button>
          <Button
            variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive"
            onClick={e => { e.stopPropagation(); handleRemove() }}
            disabled={removing}
            title="Remove registry"
          >
            {removing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border px-4 py-4 space-y-5">
          {error && <p className="text-xs text-destructive">{error}</p>}

          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Name</label>
              <Input value={form.name} onChange={e => set('name')(e.target.value)} placeholder="My Plugin Repo" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Git Repository URL</label>
              <Input value={form.externalUrl} onChange={e => set('externalUrl')(e.target.value)} placeholder="https://github.com/org/repo" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Branch</label>
              <Input value={form.externalBranch} onChange={e => set('externalBranch')(e.target.value)} placeholder="main" />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-xs text-muted-foreground">Enable Auto Sync</label>
              <input type="checkbox" checked={form.syncEnabled} onChange={e => set('syncEnabled')(e.target.checked)}
                className="h-4 w-4 rounded border-input accent-primary cursor-pointer" />
            </div>
            {form.syncEnabled && (
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Sync Interval</label>
                <Select value={String(form.syncInterval)} onValueChange={v => set('syncInterval')(Number(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SYNC_INTERVAL_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={String(opt.value)}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Include Patterns</label>
              <textarea value={form.includePatterns} onChange={e => set('includePatterns')(e.target.value)}
                className="w-full min-h-[100px] px-3 py-2 text-sm rounded-md border border-input bg-background resize-y font-mono"
                placeholder={DEFAULT_INCLUDE_PATTERNS} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Exclude Patterns</label>
              <textarea value={form.excludePatterns} onChange={e => set('excludePatterns')(e.target.value)}
                className="w-full min-h-[48px] px-3 py-2 text-sm rounded-md border border-input bg-background resize-y font-mono"
                placeholder="node_modules/**" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Conflict Strategy</label>
              <Select value={form.conflictStrategy} onValueChange={v => set('conflictStrategy')(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="keep_remote">Keep Remote — always use Git version</SelectItem>
                  <SelectItem value="keep_local">Keep Local — preserve manual edits</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3 pt-1">
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </Button>
              {successMsg && <span className="text-xs text-green-600">{successMsg}</span>}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-medium flex items-center gap-1.5 text-muted-foreground">
                <Clock className="h-3.5 w-3.5" /> Sync History
              </h4>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={loadLogs}>
                <RefreshCw className="h-3 w-3" />
              </Button>
            </div>
            {logs.length === 0 ? (
              <p className="text-xs text-muted-foreground">No sync history yet</p>
            ) : (
              <div className="rounded-md border border-border overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground">Time</th>
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground">Status</th>
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground">Changes</th>
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground">Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map(log => (
                      <tr key={log.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20">
                        <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">{formatDate(log.startedAt)}</td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-1">
                            {log.status === 'success' && <CheckCircle2 className="h-3 w-3 text-green-500" />}
                            {log.status === 'failed' && <XCircle className="h-3 w-3 text-destructive" />}
                            {log.status === 'running' && <Loader2 className="h-3 w-3 text-blue-500 animate-spin" />}
                            <StatusBadge status={log.status} />
                          </div>
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {log.status === 'success' || log.status === 'failed'
                            ? `+${log.addedItems} ~${log.updatedItems} -${log.deletedItems} =${log.skippedItems}`
                            : '—'}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {log.durationMs ? formatDuration(log.durationMs) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function AddRegistryForm({ orgId, onAdded }: { orgId: string; onAdded: () => void }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<RegistryFormState>(() => defaultForm())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (k: keyof RegistryFormState) => (v: string | boolean | number) =>
    setForm(f => ({ ...f, [k]: v }))

  const handleAdd = async () => {
    if (!form.externalUrl.trim()) { setError('Git URL is required'); return }
    setSaving(true)
    setError('')
    try {
      const payload: CreateSyncRegistryInput = {
        name: form.name,
        externalUrl: form.externalUrl.trim(),
        externalBranch: form.externalBranch || 'main',
        syncEnabled: form.syncEnabled,
        syncInterval: form.syncInterval,
        includePatterns: form.includePatterns.split('\n').map(s => s.trim()).filter(Boolean),
        excludePatterns: form.excludePatterns.split('\n').map(s => s.trim()).filter(Boolean),
        conflictStrategy: form.conflictStrategy,
      }
      await orgRegistryApi.add(orgId, payload)
      setForm(defaultForm())
      setOpen(false)
      onAdded()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add registry')
    } finally {
      setSaving(false)
    }
  }

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="w-full">
        <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Git Repository
      </Button>
    )
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      <h4 className="text-sm font-medium">Add Git Repository</h4>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">Name</label>
        <Input value={form.name} onChange={e => set('name')(e.target.value)} placeholder="My Plugin Repo" />
      </div>
      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">Git Repository URL <span className="text-destructive">*</span></label>
        <Input value={form.externalUrl} onChange={e => set('externalUrl')(e.target.value)} placeholder="https://github.com/org/repo" />
      </div>
      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">Branch</label>
        <Input value={form.externalBranch} onChange={e => set('externalBranch')(e.target.value)} placeholder="main" />
      </div>
      <div className="flex items-center justify-between">
        <label className="text-xs text-muted-foreground">Enable Auto Sync</label>
        <input type="checkbox" checked={form.syncEnabled} onChange={e => set('syncEnabled')(e.target.checked)}
          className="h-4 w-4 rounded border-input accent-primary cursor-pointer" />
      </div>
      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">Include Patterns</label>
        <textarea value={form.includePatterns} onChange={e => set('includePatterns')(e.target.value)}
          className="w-full min-h-[80px] px-3 py-2 text-sm rounded-md border border-input bg-background resize-y font-mono"
          placeholder={DEFAULT_INCLUDE_PATTERNS} />
      </div>
      <div className="flex gap-2 pt-1">
        <Button size="sm" onClick={handleAdd} disabled={saving}>
          {saving ? 'Adding…' : 'Add'}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => { setOpen(false); setError('') }}>Cancel</Button>
      </div>
    </div>
  )
}

export function OrgSyncTab({ orgId }: OrgSyncTabProps) {
  const [registries, setRegistries] = useState<CapabilityRegistry[]>([])
  const [loading, setLoading] = useState(true)

  const loadRegistries = useCallback(async () => {
    try {
      const res = await orgRegistryApi.list(orgId)
      setRegistries(res.registries ?? [])
    } catch {}
  }, [orgId])

  useEffect(() => {
    setLoading(true)
    loadRegistries().finally(() => setLoading(false))
  }, [loadRegistries])

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-8">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading sync information…
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {registries.length === 0 && (
        <p className="text-sm text-muted-foreground py-2">No Git repositories bound yet.</p>
      )}
      {registries.map(reg => (
        <RegistryCard
          key={reg.id}
          orgId={orgId}
          registry={reg}
          onRemoved={loadRegistries}
          onUpdated={loadRegistries}
        />
      ))}
      <AddRegistryForm orgId={orgId} onAdded={loadRegistries} />
    </div>
  )
}
