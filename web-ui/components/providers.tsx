'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { NextIntlClientProvider } from 'next-intl'
import { RepoFilterProvider } from '@/lib/repo-filter-context'
import zhMessages from '@/messages/zh.json'
import enMessages from '@/messages/en.json'

type Locale = 'zh' | 'en'

const MESSAGES: Record<Locale, Record<string, unknown>> = {
  zh: zhMessages,
  en: enMessages,
}

interface LocaleContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: 'zh',
  setLocale: () => {},
})

export function useLocale() {
  return useContext(LocaleContext)
}

const LOCALE_COOKIE = 'locale'

function getInitialLocale(): Locale {
  if (typeof document === 'undefined') return 'zh'
  const match = document.cookie.match(/(?:^|;\s*)locale=([^;]*)/)
  const val = match?.[1]
  return val === 'en' || val === 'zh' ? val : 'zh'
}

export function Providers({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getInitialLocale())

  const setLocale = (next: Locale) => {
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000`
    setLocaleState(next)
  }

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      <NextIntlClientProvider locale={locale} messages={MESSAGES[locale]} timeZone="Asia/Shanghai">
        <RepoFilterProvider>
          {children}
        </RepoFilterProvider>
      </NextIntlClientProvider>
    </LocaleContext.Provider>
  )
}
