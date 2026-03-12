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
import { syncApi, registryApi, type SyncStatus, type SyncLog, type CapabilityRegistry } from '@/lib/api-client'
import { RefreshCw, Play, Square, GitBranch, Clock, CheckCircle2, XCircle, Loader2 } from 'lucide-react'

interface OrgSyncTabProps {
  orgId: string
}

const SYNC_INTERVAL_OPTIONS = [
  { label: 'Every hour', value: 3600 },
  { label: 'Every 6 hours', value: 21600 },
  { label: 'Every day', value: 86400 },
]

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
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.cls}`}>{s.label}</span>
  )
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

export function OrgSyncTab({ orgId }: OrgSyncTabProps) {
  const [status, setStatus] = useState<SyncStatus | null>(null)
  const [logs, setLogs] = useState<SyncLog[]>([])
  const [registry, setRegistry] = useState<CapabilityRegistry | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [savingConfig, setSavingConfig] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const [externalUrl, setExternalUrl] = useState('')
  const [externalBranch, setExternalBranch] = useState('main')
  const [syncEnabled, setSyncEnabled] = useState(false)
  const [syncInterval, setSyncInterval] = useState(3600)
  const [includePatterns, setIncludePatterns] = useState('')
  const [excludePatterns, setExcludePatterns] = useState('')
  const [conflictStrategy, setConflictStrategy] = useState('keep_remote')

  const loadData = useCallback(async () => {
    try {
      const [statusRes, logsRes] = await Promise.all([
        syncApi.getOrgSyncStatus(orgId),
        syncApi.listOrgSyncLogs(orgId),
      ])
      setStatus(statusRes)
      setLogs(logsRes.logs || [])
    } catch {}
  }, [orgId])

  const loadRegistry = useCallback(async () => {
    try {
      const res = await fetch(`/api/organizations/${orgId}/registry`)
      if (res.ok) {
        const reg: CapabilityRegistry = await res.json()
        setRegistry(reg)
        setExternalUrl(reg.externalUrl || '')
        setExternalBranch(reg.externalBranch || 'main')
        setSyncEnabled(reg.syncEnabled || false)
        setSyncInterval(reg.syncInterval || 3600)
        const cfg = reg.syncConfig as Record<string, unknown> | undefined
        if (cfg) {
          const inc = cfg.includePatterns as string[] | undefined
          const exc = cfg.excludePatterns as string[] | undefined
          const cs = cfg.conflictStrategy as string | undefined
          if (inc) setIncludePatterns(inc.join('\n'))
          if (exc) setExcludePatterns(exc.join('\n'))
          if (cs) setConflictStrategy(cs)
        }
      }
    } catch {}
  }, [orgId])

  useEffect(() => {
    setLoading(true)
    Promise.all([loadData(), loadRegistry()]).finally(() => setLoading(false))
  }, [loadData, loadRegistry])

  useEffect(() => {
    if (status?.syncStatus === 'syncing') {
      const t = setInterval(loadData, 3000)
      return () => clearInterval(t)
    }
  }, [status?.syncStatus, loadData])

  const handleTriggerSync = async () => {
    setSyncing(true)
    setError('')
    try {
      await syncApi.triggerOrgSync(orgId)
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to trigger sync')
    } finally {
      setSyncing(false)
    }
  }

  const handleCancelSync = async () => {
    try {
      await syncApi.cancelOrgSync(orgId)
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel sync')
    }
  }

  const handleSaveConfig = async () => {
    if (!registry) return
    setSavingConfig(true)
    setError('')
    setSuccessMsg('')
    try {
      const syncConfig = {
        includePatterns: includePatterns.split('\n').map(s => s.trim()).filter(Boolean),
        excludePatterns: excludePatterns.split('\n').map(s => s.trim()).filter(Boolean),
        conflictStrategy,
      }
      await fetch(`/api/registries/${registry.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          externalUrl,
          externalBranch,
          syncEnabled,
          syncInterval,
          syncConfig,
        }),
      })
      setSuccessMsg('Configuration saved')
      setTimeout(() => setSuccessMsg(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save configuration')
    } finally {
      setSavingConfig(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-8">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading sync information…
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <div className="p-4 rounded-lg border border-border bg-card space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-muted-foreground" />
            Sync Status
          </h3>
          <div className="flex items-center gap-2">
            {status && <StatusBadge status={status.syncStatus} />}
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={loadData}>
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-xs text-muted-foreground mb-0.5">Last Synced</div>
            <div>{formatDate(status?.lastSyncedAt)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-0.5">Last Commit SHA</div>
            <div className="font-mono text-xs">{status?.lastSyncSha?.slice(0, 8) || '—'}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-0.5">Pending Jobs</div>
            <div>{status?.pendingJobs ?? 0}</div>
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          <Button
            size="sm"
            onClick={handleTriggerSync}
            disabled={syncing || status?.syncStatus === 'syncing'}
          >
            {syncing || status?.syncStatus === 'syncing' ? (
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            ) : (
              <Play className="h-3.5 w-3.5 mr-1.5" />
            )}
            Sync Now
          </Button>
          {(status?.pendingJobs ?? 0) > 0 && (
            <Button variant="outline" size="sm" onClick={handleCancelSync}>
              <Square className="h-3.5 w-3.5 mr-1.5" />
              Cancel
            </Button>
          )}
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>

      {/* Configuration */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium">Sync Configuration</h3>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-sm text-muted-foreground">Git Repository URL</label>
            <Input value={externalUrl} onChange={e => setExternalUrl(e.target.value)} placeholder="https://github.com/org/repo" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm text-muted-foreground">Branch</label>
            <Input value={externalBranch} onChange={e => setExternalBranch(e.target.value)} placeholder="main" />
          </div>
          <div className="flex items-center justify-between">
            <label className="text-sm text-muted-foreground">Enable Auto Sync</label>
            <input
              type="checkbox"
              checked={syncEnabled}
              onChange={e => setSyncEnabled(e.target.checked)}
              className="h-4 w-4 rounded border-input accent-primary cursor-pointer"
            />
          </div>
          {syncEnabled && (
            <div className="space-y-1.5">
              <label className="text-sm text-muted-foreground">Sync Interval</label>
              <Select value={String(syncInterval)} onValueChange={v => setSyncInterval(Number(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SYNC_INTERVAL_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={String(opt.value)}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-sm text-muted-foreground">Include Patterns</label>
            <textarea
              value={includePatterns}
              onChange={e => setIncludePatterns(e.target.value)}
              className="w-full min-h-[64px] px-3 py-2 text-sm rounded-md border border-input bg-background resize-y font-mono"
              placeholder="**/*.md"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm text-muted-foreground">Exclude Patterns</label>
            <textarea
              value={excludePatterns}
              onChange={e => setExcludePatterns(e.target.value)}
              className="w-full min-h-[48px] px-3 py-2 text-sm rounded-md border border-input bg-background resize-y font-mono"
              placeholder="node_modules/**"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm text-muted-foreground">Conflict Strategy</label>
            <Select value={conflictStrategy} onValueChange={setConflictStrategy}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="keep_remote">Keep Remote — always use Git version</SelectItem>
                <SelectItem value="keep_local">Keep Local — preserve manual edits</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button size="sm" onClick={handleSaveConfig} disabled={savingConfig}>
            {savingConfig ? 'Saving…' : 'Save Configuration'}
          </Button>
          {successMsg && <span className="text-xs text-green-600">{successMsg}</span>}
        </div>
      </div>

      {/* Sync Logs */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          Sync History
        </h3>
        {logs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No sync history yet</p>
        ) : (
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Time</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Trigger</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Changes</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Duration</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {formatDate(log.startedAt)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs capitalize">{log.triggerType}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {log.status === 'success' && <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />}
                        {log.status === 'failed' && <XCircle className="h-3.5 w-3.5 text-destructive" />}
                        {log.status === 'running' && <Loader2 className="h-3.5 w-3.5 text-blue-500 animate-spin" />}
                        <StatusBadge status={log.status} />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {log.status === 'success' || log.status === 'failed' ? (
                        <span className="text-muted-foreground">
                          +{log.addedItems} ~{log.updatedItems} -{log.deletedItems} ={log.skippedItems}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
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
  )
}
