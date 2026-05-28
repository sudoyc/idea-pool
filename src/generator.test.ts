import { describe, expect, it } from 'vitest'
import { generateIdeas } from './generator'
import type { IdeaRequest } from './types'

const baseRequest: IdeaRequest = {
  context: '我想做一个本地优先的灵感池，快速记录和推荐 vibe coding 项目',
  timeBudget: 'tonight',
  techStack: 'Vite React TypeScript local-first',
  constraints: '不要后端，不要登录，先做可用 MVP',
  count: 5,
}

describe('generateIdeas', () => {
  it('prioritizes the project idea pool when the user asks for an inspiration pool', () => {
    const ideas = generateIdeas(baseRequest)

    expect(ideas).toHaveLength(5)
    expect(ideas[0].id).toBe('personal-project-idea-pool-agent')
    expect(ideas[0].matchedTerms).toContain('灵感池')
  })

  it('respects the requested count and returns deterministic ranking', () => {
    const firstRun = generateIdeas({ ...baseRequest, count: 3 })
    const secondRun = generateIdeas({ ...baseRequest, count: 3 })

    expect(firstRun).toHaveLength(3)
    expect(secondRun.map((idea) => idea.id)).toEqual(firstRun.map((idea) => idea.id))
  })
})
