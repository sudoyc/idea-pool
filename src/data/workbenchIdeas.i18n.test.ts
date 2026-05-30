import { describe, expect, it } from 'vitest'
import { createDefaultAnalysis, createInitialWorkbenchIdeas, initialWorkbenchIdeas } from './workbenchIdeas'

describe('localized starter workbench ideas', () => {
  it('keeps a Chinese default seed for current local-first behavior', () => {
    expect(initialWorkbenchIdeas).toEqual(createInitialWorkbenchIdeas('zh'))
    expect(initialWorkbenchIdeas[0]?.title).toContain('思路清仓')
  })

  it('can create English starter ideas without reusing Chinese body copy verbatim', () => {
    const zh = createInitialWorkbenchIdeas('zh')
    const en = createInitialWorkbenchIdeas('en')

    expect(en).toHaveLength(zh.length)
    expect(en[0]?.title).toContain('Mind Shredder')
    expect(en[0]?.summary).not.toBe(zh[0]?.summary)
    expect(en[2]?.aiAnalysis?.mvpSuggestion).not.toBe(zh[2]?.aiAnalysis?.mvpSuggestion)
  })

  it('builds locale-aware default AI guidance', () => {
    expect(createDefaultAnalysis('zh').firstActions).toContain('主视图保持为单一 idea pool')
    expect(createDefaultAnalysis('en').firstActions).toContain('Keep the main view as a single idea pool')
  })
})
