import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useIdeaStore } from './useIdeaStore'

const resetStore = () => {
  useIdeaStore.setState({
    ideas: [],
    selectedIdeaId: null,
    detailOpen: false,
    activeFilter: 'PIPELINE',
    screen: 'WORKBENCH',
    statusMessage: null,
    sync: { status: 'idle', pendingCount: 0, lastError: null, lastSyncedAt: null },
    syncQueue: [],
  } as Partial<ReturnType<typeof useIdeaStore.getState>>)
}

describe('local-first remote sync queue', () => {
  beforeEach(() => {
    resetStore()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('queues failed local writes and flushes them when the server is reachable again', async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } }))
    vi.stubGlobal('fetch', fetchMock)

    useIdeaStore.getState().createIdea()
    await Promise.resolve()
    await Promise.resolve()

    expect(useIdeaStore.getState().ideas).toHaveLength(1)
    expect(useIdeaStore.getState().sync).toMatchObject({ status: 'queued', pendingCount: 1 })
    expect(useIdeaStore.getState().statusMessage).toBe('sync.queued')

    await useIdeaStore.getState().flushSyncQueue()

    expect(useIdeaStore.getState().sync).toMatchObject({ status: 'synced', pendingCount: 0, lastError: null })
    expect(useIdeaStore.getState().sync.lastSyncedAt).toEqual(expect.any(String))
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})
