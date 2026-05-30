import { describe, expect, it } from 'vitest'
import { resolveDetailShortcut } from './detailKeyboard'

describe('detail keyboard shortcuts', () => {
  it('closes detail with Escape unless the user is in an active composition session', () => {
    expect(resolveDetailShortcut({ key: 'Escape', detailOpen: true, isTextInput: true, isComposing: false })).toBe('closeDetail')
    expect(resolveDetailShortcut({ key: 'Escape', detailOpen: true, isTextInput: true, isComposing: true })).toBeNull()
  })

  it('saves the current detail with ctrl/cmd+s', () => {
    expect(resolveDetailShortcut({ key: 's', ctrlKey: true, detailOpen: true, isTextInput: false })).toBe('saveDetail')
    expect(resolveDetailShortcut({ key: 'S', metaKey: true, detailOpen: true, isTextInput: false })).toBe('saveDetail')
  })

  it('creates a new seed only when text entry is not focused', () => {
    expect(resolveDetailShortcut({ key: 'n', detailOpen: false, isTextInput: false })).toBe('newSeed')
    expect(resolveDetailShortcut({ key: 'n', detailOpen: true, isTextInput: true })).toBeNull()
  })
})
