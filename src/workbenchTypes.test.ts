import { describe, expect, it } from 'vitest'
import { initialWorkbenchIdeas } from './data/workbenchIdeas'
import { statusLabels, statusOrder } from './workbenchTypes'
import { useIdeaStore } from './store/useIdeaStore'

describe('workbench model', () => {
  it('keeps the three kanban statuses explicit', () => {
    expect(statusOrder).toEqual(['INBOX', 'PIPELINE', 'TRASH'])
    expect(statusLabels.PIPELINE).toBe('AI Enriched')
  })

  it('ships with an AI-enriched seed idea', () => {
    expect(initialWorkbenchIdeas.some((idea) => idea.aiEnriched && idea.aiAnalysis)).toBe(true)
  })

  it('keeps detail open when switching filters', () => {
    const firstIdea = initialWorkbenchIdeas[0]
    useIdeaStore.setState({
      ideas: initialWorkbenchIdeas,
      selectedIdeaId: null,
      detailOpen: false,
      activeFilter: 'PIPELINE',
      screen: 'WORKBENCH',
      statusMessage: '',
    })

    useIdeaStore.getState().openDetail(firstIdea.id)
    useIdeaStore.getState().setActiveFilter('TRASH')

    expect(useIdeaStore.getState().detailOpen).toBe(true)
    expect(useIdeaStore.getState().selectedIdeaId).toBe(firstIdea.id)
    expect(useIdeaStore.getState().activeFilter).toBe('TRASH')
  })

  it('can enter settings without losing current selection', () => {
    const firstIdea = initialWorkbenchIdeas[0]
    useIdeaStore.setState({
      ideas: initialWorkbenchIdeas,
      selectedIdeaId: firstIdea.id,
      detailOpen: true,
      activeFilter: 'PIPELINE',
      screen: 'WORKBENCH',
      statusMessage: '',
    })

    useIdeaStore.getState().setScreen('SETTINGS')

    expect(useIdeaStore.getState().screen).toBe('SETTINGS')
    expect(useIdeaStore.getState().selectedIdeaId).toBe(firstIdea.id)
  })
})
