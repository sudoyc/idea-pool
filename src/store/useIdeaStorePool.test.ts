import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getVisibleIdeasForLens, useIdeaStore } from './useIdeaStore'
import type { WorkbenchIdea } from '../workbenchTypes'

const now = '2026-05-29T00:00:00.000Z'

const idea = (id: string, status: WorkbenchIdea['status']): WorkbenchIdea => ({
  id,
  title: id,
  summary: `${id} summary`,
  status,
  source: 'local',
  tags: [id],
  whyNow: `${id} why`,
  mvpScope: `${id} scope`,
  firstAction: `${id} action`,
  scratchpad: '',
  aiEnriched: false,
  sortOrder: 0,
  createdAt: now,
  updatedAt: now,
})

const ideas = [idea('seed', 'INBOX'), idea('active', 'PIPELINE'), idea('parked', 'TRASH')]

const resetStore = () => {
  useIdeaStore.setState({
    ideas,
    selectedIdeaId: null,
    detailOpen: false,
    activeLens: 'ALL',
    screen: 'WORKBENCH',
    statusMessage: null,
    sync: { status: 'idle', pendingCount: 0, lastError: null, lastSyncedAt: null },
    syncQueue: [],
  } as Partial<ReturnType<typeof useIdeaStore.getState>>)
}

describe('single-pool idea lens store behavior', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 })))
    resetStore()
  })

  it('filters visible ideas by lens without treating status as permanent columns', () => {
    expect(getVisibleIdeasForLens(ideas, 'ALL').map((item) => item.id)).toEqual(['seed', 'active', 'parked'])
    expect(getVisibleIdeasForLens(ideas, 'INBOX').map((item) => item.id)).toEqual(['seed'])
    expect(getVisibleIdeasForLens(ideas, 'PIPELINE').map((item) => item.id)).toEqual(['active'])
    expect(getVisibleIdeasForLens(ideas, 'TRASH').map((item) => item.id)).toEqual(['parked'])
  })

  it('stores the active pool lens independently from detail selection', () => {
    expect(useIdeaStore.getState().activeLens).toBe('ALL')

    useIdeaStore.getState().setIdeaPoolLens('PIPELINE')

    expect(useIdeaStore.getState()).toMatchObject({ activeLens: 'PIPELINE', screen: 'WORKBENCH', detailOpen: false })
  })

  it('classifies an idea through moveIdea without opening the detail layer', async () => {
    useIdeaStore.setState({ selectedIdeaId: 'seed', detailOpen: false })

    useIdeaStore.getState().moveIdea('seed', 'TRASH')
    await Promise.resolve()

    const moved = useIdeaStore.getState().ideas.find((item) => item.id === 'seed')
    expect(moved?.status).toBe('TRASH')
    expect(useIdeaStore.getState().detailOpen).toBe(false)
    expect(useIdeaStore.getState().statusMessage).toBe('status.movedTo.TRASH')
    expect(fetch).toHaveBeenCalledWith(
      '/api/ideas/seed',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ status: 'TRASH' }),
      }),
    )
  })

  it('permanently deletes only archived ideas', async () => {
    useIdeaStore.setState({ selectedIdeaId: 'seed', detailOpen: true })

    const inboxResult = useIdeaStore.getState().deleteSelectedIdea()
    await Promise.resolve()

    expect(inboxResult).toBe(false)
    expect(useIdeaStore.getState().ideas.map((item) => item.id)).toContain('seed')
    expect(fetch).not.toHaveBeenCalledWith('/api/ideas/seed', expect.objectContaining({ method: 'DELETE' }))

    useIdeaStore.setState({ selectedIdeaId: 'parked', detailOpen: true })
    const archivedResult = useIdeaStore.getState().deleteSelectedIdea()
    await Promise.resolve()

    expect(archivedResult).toBe(true)
    expect(useIdeaStore.getState().ideas.map((item) => item.id)).not.toContain('parked')
    expect(useIdeaStore.getState().detailOpen).toBe(false)
    expect(fetch).toHaveBeenCalledWith('/api/ideas/parked', expect.objectContaining({ method: 'DELETE' }))
  })
})
