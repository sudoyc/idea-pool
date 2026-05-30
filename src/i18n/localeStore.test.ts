import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  defaultLocale,
  localeStorageKey,
  readStoredLocale,
  resolveInitialLocale,
  writeStoredLocale,
} from './localeStore'

describe('i18n locale persistence', () => {
  beforeEach(() => {
    const store = new Map<string, string>()
    vi.stubGlobal('window', {
      localStorage: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => {
          store.set(key, value)
        },
        removeItem: (key: string) => {
          store.delete(key)
        },
      },
    })
  })

  it('defaults to Chinese when no locale is stored', () => {
    expect(defaultLocale).toBe('zh')
    expect(resolveInitialLocale()).toBe('zh')
  })

  it('uses a valid stored locale and ignores invalid values', () => {
    window.localStorage.setItem(localeStorageKey, 'en')
    expect(readStoredLocale()).toBe('en')
    expect(resolveInitialLocale()).toBe('en')

    window.localStorage.setItem(localeStorageKey, 'fr')
    expect(readStoredLocale()).toBeNull()
    expect(resolveInitialLocale()).toBe('zh')
  })

  it('persists user locale choice under a stable key', () => {
    writeStoredLocale('en')

    expect(localeStorageKey).toBe('personal-idea-workbench:locale')
    expect(window.localStorage.getItem(localeStorageKey)).toBe('en')
  })
})
