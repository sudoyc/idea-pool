import { describe, expect, it } from 'vitest'
import { initialWorkbenchIdeas } from './data/workbenchIdeas'
import { statusLabels, statusOrder } from './workbenchTypes'
import { useIdeaStore } from './store/useIdeaStore'

describe('workbench model', () => {
  it('keeps the idea lifecycle statuses explicit without making them permanent workspace columns', () => {
    expect(statusOrder).toEqual(['INBOX', 'PIPELINE', 'TRASH'])
    expect(statusLabels.PIPELINE).toBe('进行中')
  })

  it('ships with seed copy that matches the single-pool workspace', () => {
    expect(JSON.stringify(initialWorkbenchIdeas)).not.toMatch(/三栏|AI Enriched/i)
  })

  it('keeps detail open when switching filters', () => {
    const firstIdea = initialWorkbenchIdeas[0]
    useIdeaStore.setState({
      ideas: initialWorkbenchIdeas,
      selectedIdeaId: null,
      detailOpen: false,
      activeFilter: 'PIPELINE',
      screen: 'WORKBENCH',
      statusMessage: null,
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
      statusMessage: null,
    })

    useIdeaStore.getState().setScreen('SETTINGS')

    expect(useIdeaStore.getState().screen).toBe('SETTINGS')
    expect(useIdeaStore.getState().selectedIdeaId).toBe(firstIdea.id)
  })

  it('can replace local ideas with remote state', () => {
    const remoteIdea = { ...initialWorkbenchIdeas[0], id: 'remote-idea', title: 'Remote Idea' }

    useIdeaStore.getState().replaceIdeas([remoteIdea])

    expect(useIdeaStore.getState().ideas).toHaveLength(1)
    expect(useIdeaStore.getState().ideas[0]?.id).toBe('remote-idea')
  })
})
