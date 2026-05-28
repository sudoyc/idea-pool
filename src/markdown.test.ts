import { describe, expect, it } from 'vitest'
import { toIdeaMarkdown } from './markdown'
import { generateIdeas } from './generator'
import type { IdeaRequest } from './types'

const request: IdeaRequest = {
  context: '灵感池 Agent',
  timeBudget: 'tonight',
  techStack: 'React TypeScript',
  constraints: '本地优先',
  count: 1,
}

describe('toIdeaMarkdown', () => {
  it('exports generated cards with request context and first action', () => {
    const markdown = toIdeaMarkdown(generateIdeas(request), request)

    expect(markdown).toContain('# Vibe Coding 灵感推荐')
    expect(markdown).toContain('灵感池 Agent')
    expect(markdown).toContain('首个 30 分钟动作')
  })
})
