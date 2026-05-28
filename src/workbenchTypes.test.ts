import { describe, expect, it } from 'vitest'
import { initialWorkbenchIdeas } from './data/workbenchIdeas'
import { statusLabels, statusOrder } from './workbenchTypes'

describe('workbench model', () => {
  it('keeps the three kanban statuses explicit', () => {
    expect(statusOrder).toEqual(['INBOX', 'PIPELINE', 'TRASH'])
    expect(statusLabels.PIPELINE).toBe('AI Enriched')
  })

  it('ships with an AI-enriched seed idea', () => {
    expect(initialWorkbenchIdeas.some((idea) => idea.aiEnriched && idea.aiAnalysis)).toBe(true)
  })
})
