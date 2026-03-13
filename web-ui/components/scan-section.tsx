'use client'

import { useEffect, useState, useCallback } from 'react'
import { scanApi, type SecurityScan, type ScanStatusResponse } from '@/lib/api-client'
import { ScanBadge } from '@/components/scan-badge'
import { Button } from '@/components/ui/button'
import { RefreshCw, ChevronDown, ChevronUp, AlertTriangle, Network, Terminal, FileText, Lightbulb } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ScanSectionProps {
  itemId: string
}

function formatDate(iso?: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('zh-CN', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function formatDuration(ms: number) {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

function PermissionRow({ icon: Icon, label, items }: { icon: React.ElementType; label: string; items: string[] }) {
  if (!items || items.length === 0) return null
  return (
    <div className="flex gap-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground w-20 shrink-0">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="flex flex-wrap gap-1">
        {items.map((item, i) => (
          <code key={i} className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">{item}</code>
        ))}
      </div>
    </div>
  )
}

export function ScanSection({ itemId }: ScanSectionProps) {
  const [statusData, setStatusData] = useState<ScanStatusResponse | null>(null)
  const [fullResult, setFullResult] = useState<SecurityScan | null>(null)
  const [history, setHistory] = useState<SecurityScan[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [triggering, setTriggering] = useState(false)
  const [loadingFull, setLoadingFull] = useState(false)
  const [polling, setPolling] = useState(false)

  const fetchStatus = useCallback(async () => {
    try {
      const data = await scanApi.getStatus(itemId)
      setStatusData(data)
      return data
    } catch {
      return null
    }
  }, [itemId])

  const fetchFullResult = useCallback(async (scanId: string) => {
    setLoadingFull(true)
    try {
      const data = await scanApi.getResult(scanId)
      setFullResult(data)
    } catch {
      /* ignore */
    } finally {
      setLoadingFull(false)
    }
  }, [])

  useEffect(() => {
    fetchStatus().then(data => {
      if (data?.latestResult?.id) {
        fetchFullResult(data.latestResult.id)
      }
    })
  }, [fetchStatus, fetchFullResult])

  useEffect(() => {
    if (statusData?.scanStatus !== 'scanning' && statusData?.scanStatus !== 'pending') {
      setPolling(false)
      return
    }
    setPolling(true)
    const timer = setInterval(async () => {
      const data = await fetchStatus()
      if (data?.scanStatus !== 'scanning' && data?.scanStatus !== 'pending') {
        setPolling(false)
        clearInterval(timer)
        if (data?.latestResult?.id) {
          fetchFullResult(data.latestResult.id)
        }
      }
    }, 4000)
    return () => clearInterval(timer)
  }, [statusData?.scanStatus, fetchStatus, fetchFullResult])

  const handleTrigger = async () => {
    setTriggering(true)
    try {
      await scanApi.trigger(itemId)
      setStatusData(prev => prev ? { ...prev, scanStatus: 'pending' } : { scanStatus: 'pending' })
    } catch {
      /* ignore */
    } finally {
      setTriggering(false)
    }
  }

  const handleShowHistory = async () => {
    if (!showHistory && history.length === 0) {
      try {
        const data = await scanApi.listResults(itemId, 1, 5)
        setHistory(data.results || [])
      } catch {
        /* ignore */
      }
    }
    setShowHistory(v => !v)
  }

  const scanStatus = statusData?.scanStatus
  const latest = statusData?.latestResult

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-muted-foreground uppercase tracking-wide">
          安全扫描
        </h2>
        <Button
          size="sm"
          variant="outline"
          onClick={handleTrigger}
          disabled={triggering || scanStatus === 'scanning' || scanStatus === 'pending'}
          className="gap-1.5"
        >
          <RefreshCw className={cn('h-3.5 w-3.5', (triggering || polling) && 'animate-spin')} />
          重新扫描
        </Button>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {/* Status row */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <ScanBadge status={scanStatus} />
            {latest?.verdict === 'reject' && (
              <span className="text-xs text-orange-600 dark:text-orange-400 flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5" />
                建议管理员介入后再安装
              </span>
            )}
            {latest?.verdict === 'caution' && (
              <span className="text-xs text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5" />
                请确认风险后安装
              </span>
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            {formatDate(statusData?.lastScannedAt)}
          </span>
        </div>

        {/* Summary */}
        {(loadingFull || fullResult) && (
          <div className="px-5 py-4 space-y-4">
            {loadingFull && !fullResult && (
              <p className="text-sm text-muted-foreground">加载扫描详情...</p>
            )}

            {fullResult && (
              <>
                {fullResult.summary && (
                  <p className="text-sm text-foreground/80">{fullResult.summary}</p>
                )}

                {/* Red flags */}
                {fullResult.redFlags && fullResult.redFlags.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-red-600 dark:text-red-400 mb-2 flex items-center gap-1">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      发现的问题（{fullResult.redFlags.length} 项）
                    </p>
                    <ul className="space-y-1">
                      {fullResult.redFlags.map((flag, i) => (
                        <li key={i} className="text-xs text-muted-foreground flex gap-2">
                          <span className="text-red-500 shrink-0">•</span>
                          {flag}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Permissions */}
                {fullResult.permissions && (
                  (fullResult.permissions.files?.length > 0 ||
                    fullResult.permissions.network?.length > 0 ||
                    fullResult.permissions.commands?.length > 0) && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">权限需求</p>
                      <PermissionRow icon={FileText} label="文件" items={fullResult.permissions.files} />
                      <PermissionRow icon={Network} label="网络" items={fullResult.permissions.network} />
                      <PermissionRow icon={Terminal} label="命令" items={fullResult.permissions.commands} />
                    </div>
                  )
                )}

                {/* Recommendations */}
                {fullResult.recommendations && fullResult.recommendations.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                      <Lightbulb className="h-3.5 w-3.5" />
                      修改建议
                    </p>
                    <ol className="space-y-1 list-decimal list-inside">
                      {fullResult.recommendations.map((rec, i) => (
                        <li key={i} className="text-xs text-muted-foreground">{rec}</li>
                      ))}
                    </ol>
                  </div>
                )}

                <div className="flex items-center gap-3 pt-1 text-xs text-muted-foreground border-t border-border/50">
                  {fullResult.scanModel && <span>模型：{fullResult.scanModel}</span>}
                  {fullResult.durationMs > 0 && <span>耗时：{formatDuration(fullResult.durationMs)}</span>}
                </div>
              </>
            )}
          </div>
        )}

        {/* History toggle */}
        <button
          onClick={handleShowHistory}
          className="w-full flex items-center justify-center gap-1.5 px-5 py-3 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors border-t border-border/50"
        >
          {showHistory ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          {showHistory ? '收起历史记录' : '查看历史扫描记录'}
        </button>

        {showHistory && history.length > 0 && (
          <div className="border-t border-border/50 divide-y divide-border/50">
            {history.map(scan => (
              <div key={scan.id} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  <ScanBadge status={scan.riskLevel as never} />
                  <span className="text-xs text-muted-foreground capitalize">{scan.triggerType}</span>
                </div>
                <span className="text-xs text-muted-foreground">{formatDate(scan.createdAt)}</span>
              </div>
            ))}
          </div>
        )}

        {showHistory && history.length === 0 && (
          <div className="px-5 py-3 border-t border-border/50 text-xs text-muted-foreground text-center">
            暂无历史记录
          </div>
        )}
      </div>
    </section>
  )
}
