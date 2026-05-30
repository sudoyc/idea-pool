import { describe, expect, it } from 'vitest'
import { messages } from './i18n/messages'

describe('polished interaction localization copy', () => {
  it('localizes empty states and guarded file upload copy in both languages', () => {
    const requiredKeys = [
      'locale.switcher.open',
      'workbench.empty.title',
      'workbench.empty.body',
      'workbench.empty.action',
      'detail.files.filenameRequired',
      'settings.mockup.title',
    ] as const

    for (const key of requiredKeys) {
      expect(messages.zh[key]).toBeTruthy()
      expect(messages.en[key]).toBeTruthy()
    }

    expect(messages.zh['workbench.empty.title']).toContain('没有')
    expect(messages.en['workbench.empty.title']).toContain('No')
  })
})
