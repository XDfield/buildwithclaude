'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle, ShieldX } from 'lucide-react'
import type { ScanStatus } from '@/lib/api-client'

interface ScanInstallGuardProps {
  scanStatus: ScanStatus | undefined
  verdict: string | undefined
  summary: string | undefined
  isOrgAdmin?: boolean
  onConfirm: () => void
  children: (onClick: () => void) => React.ReactNode
}

export function ScanInstallGuard({
  scanStatus,
  verdict,
  summary,
  isOrgAdmin = false,
  onConfirm,
  children,
}: ScanInstallGuardProps) {
  const [open, setOpen] = useState(false)

  const needsGuard = verdict === 'caution' || verdict === 'reject'

  const handleClick = () => {
    if (!needsGuard) {
      onConfirm()
      return
    }
    setOpen(true)
  }

  const handleConfirm = () => {
    setOpen(false)
    onConfirm()
  }

  const isReject = verdict === 'reject'

  return (
    <>
      {children(handleClick)}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {isReject
                ? <ShieldX className="h-5 w-5 text-red-500" />
                : <AlertTriangle className="h-5 w-5 text-yellow-500" />
              }
              {isReject ? '安全警告：高风险内容' : '安全提示'}
            </DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-3 pt-1">
                <p className="text-sm text-muted-foreground">
                  该能力项的扫描结果为
                  <span className={isReject ? 'text-red-600 font-medium' : 'text-yellow-600 font-medium'}>
                    {scanStatus === 'high' ? '「高风险」' : scanStatus === 'extreme' ? '「极高风险」' : '「中风险」'}
                  </span>，请确认后再安装：
                </p>
                {summary && (
                  <div className="rounded-lg bg-muted/60 px-4 py-3 text-sm text-foreground/80">
                    {summary}
                  </div>
                )}
                {isReject && !isOrgAdmin && (
                  <p className="text-xs text-muted-foreground border border-border rounded-lg px-3 py-2">
                    该内容被标记为高风险，仅组织管理员可继续安装。如有需要，请联系管理员。
                  </p>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              取消
            </Button>
            {(!isReject || isOrgAdmin) && (
              <Button
                variant={isReject ? 'destructive' : 'default'}
                onClick={handleConfirm}
              >
                我已了解风险，继续安装
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
