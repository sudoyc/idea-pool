import { useMemo, useState, type ReactNode } from 'react'
import { t } from './messages'
import { I18nContext, type I18nContextValue } from './I18nContext'
import { resolveInitialLocale, writeStoredLocale } from './localeStore'
import type { Locale } from './types'

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => resolveInitialLocale())

  const setLocale = (nextLocale: Locale) => {
    setLocaleState(nextLocale)
    writeStoredLocale(nextLocale)
  }

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale,
      t: (key) => t(locale, key),
    }),
    [locale],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}
