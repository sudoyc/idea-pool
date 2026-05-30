import { defaultLocale, isLocale, type Locale } from './types'

export const localeStorageKey = 'personal-idea-workbench:locale'

export const readStoredLocale = (): Locale | null => {
  if (typeof window === 'undefined') return null

  const value = window.localStorage.getItem(localeStorageKey)
  return value && isLocale(value) ? value : null
}

export const writeStoredLocale = (locale: Locale) => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(localeStorageKey, locale)
}

export const resolveInitialLocale = (): Locale => readStoredLocale() ?? defaultLocale

export { defaultLocale }
