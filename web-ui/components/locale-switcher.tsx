'use client'

import { useLocale } from '@/components/providers'

export function LocaleSwitcher() {
  const { locale, setLocale } = useLocale()

  return (
    <button
      onClick={() => setLocale(locale === 'zh' ? 'en' : 'zh')}
      className="px-2.5 py-1.5 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors font-medium"
      title={locale === 'zh' ? 'Switch to English' : '切换为中文'}
    >
      {locale === 'zh' ? 'EN' : '中'}
    </button>
  )
}
