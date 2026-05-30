import { describe, expect, it } from 'vitest'
import { messages, supportedLocales, t, type TranslationKey } from './messages'

describe('bilingual i18n message catalog', () => {
  it('supports Chinese and English with Chinese as the first/default locale', () => {
    expect(supportedLocales).toEqual(['zh', 'en'])
  })

  it('ships the required product UI translation keys for both locales', () => {
    const requiredKeys: TranslationKey[] = [
      'app.brand',
      'nav.poolLenses',
      'nav.tags',
      'nav.system',
      'nav.settings',
      'action.newSeed',
      'action.back',
      'action.saveChanges',
      'action.discard',
      'auth.title',
      'auth.passwordLabel',
      'auth.tokenLabel',
      'auth.submit',
      'workbench.pool.kicker',
      'workbench.pool.visibleCount',
      'workbench.pool.totalCount',
      'workbench.pool.empty',
      'detail.section.whyNow',
      'detail.section.mvpScope',
      'detail.section.firstAction',
      'detail.section.scratchpad',
      'detail.scratchpad.placeholder',
      'detail.ai.title',
      'detail.files.title',
      'settings.title',
      'settings.session.title',
      'settings.session.currentMode',
      'settings.session.mode.disabled',
      'locale.switcher.label',
      'sync.idle',
      'sync.queued',
      'sync.syncing',
      'sync.synced',
      'sync.error',
    ]

    for (const locale of supportedLocales) {
      for (const key of requiredKeys) {
        expect(messages[locale][key], `${locale}:${key}`).toBeTruthy()
      }
    }
  })

  it('translates ordinary UI copy while preserving deliberate technical terms', () => {
    expect(t('zh', 'nav.settings')).toBe('设置')
    expect(t('en', 'nav.settings')).toBe('Settings')
    expect(t('zh', 'action.saveChanges')).not.toBe(t('en', 'action.saveChanges'))

    expect(t('zh', 'term.ai')).toBe('AI')
    expect(t('en', 'term.ai')).toBe('AI')
    expect(t('zh', 'term.agentApi')).toContain('Agent API')
    expect(t('en', 'term.agentApi')).toContain('Agent API')
  })
})
