'use client'

import { cn } from '@/lib/utils'
import type { ScanStatus } from '@/lib/api-client'
import { Shield, ShieldAlert, ShieldCheck, ShieldX, Loader2, ShieldOff } from 'lucide-react'

interface ScanBadgeProps {
  status: ScanStatus | undefined
  className?: string
  showLabel?: boolean
}

const SCAN_CONFIG: Record<string, {
  label: string
  icon: React.ElementType
  className: string
}> = {
  clean:     { label: '安全',     icon: ShieldCheck, className: 'text-green-600 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-950 dark:border-green-800' },
  low:       { label: '低风险',   icon: ShieldCheck, className: 'text-green-600 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-950 dark:border-green-800' },
  medium:    { label: '注意',     icon: ShieldAlert, className: 'text-yellow-600 bg-yellow-50 border-yellow-200 dark:text-yellow-400 dark:bg-yellow-950 dark:border-yellow-800' },
  high:      { label: '高风险',   icon: ShieldX,     className: 'text-orange-600 bg-orange-50 border-orange-200 dark:text-orange-400 dark:bg-orange-950 dark:border-orange-800' },
  extreme:   { label: '极高风险', icon: ShieldX,     className: 'text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-950 dark:border-red-800' },
  scanning:  { label: '扫描中',   icon: Loader2,     className: 'text-blue-500 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-950 dark:border-blue-800' },
  pending:   { label: '待扫描',   icon: Shield,      className: 'text-muted-foreground bg-muted border-border' },
  error:     { label: '扫描失败', icon: ShieldOff,   className: 'text-muted-foreground bg-muted border-border' },
  skipped:   { label: '已跳过',   icon: ShieldOff,   className: 'text-muted-foreground bg-muted border-border' },
  unscanned: { label: '未扫描',   icon: Shield,      className: 'text-muted-foreground bg-muted border-border' },
}

export function ScanBadge({ status, className, showLabel = true }: ScanBadgeProps) {
  const key = status || 'unscanned'
  const cfg = SCAN_CONFIG[key] || SCAN_CONFIG.unscanned
  const Icon = cfg.icon
  const isSpinning = key === 'scanning'

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-xs font-medium',
        cfg.className,
        className
      )}
    >
      <Icon className={cn('h-3 w-3 shrink-0', isSpinning && 'animate-spin')} />
      {showLabel && <span>{cfg.label}</span>}
    </span>
  )
}
