import { describe, expect, it } from 'vitest'
import { completeIdea } from './llm'
import type { IdeaRecord } from './types'

const idea: IdeaRecord = {
  id: 'test-idea',
  title: '测试灵感',
  summary: '一个用于测试 LLM fallback 的 idea。',
  status: 'INBOX',
  tags: ['test'],
  whyNow: '现在需要确认 fallback 稳定。',
  scratchpad: '',
  aiEnriched: false,
  createdAt: '2026-05-28T00:00:00.000Z',
  updatedAt: '2026-05-28T00:00:00.000Z',
}

describe('completeIdea', () => {
  it('returns a local fallback without an API key', async () => {
    const previous = process.env.LLM_API_KEY
    delete process.env.LLM_API_KEY

    const analysis = await completeIdea(idea)

    expect(analysis.mvpSuggestion).toContain(idea.title)
    expect(analysis.risks.length).toBeGreaterThan(0)
    expect(analysis.firstActions.length).toBeGreaterThan(0)

    process.env.LLM_API_KEY = previous
  })
})
