import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useIdeaStore } from './useIdeaStore'

const resetStore = () => {
  useIdeaStore.setState({
    ideas: [],
    selectedIdeaId: null,
    detailOpen: false,
    activeFilter: 'PIPELINE',
    activeLens: 'ALL',
    screen: 'WORKBENCH',
    statusMessage: null,
    sync: { syncState: 'idle', pendingCount: 0, lastSyncError: null, lastSyncedAt: null },
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

  it('tracks queued, syncing, synced, and failed local-first writes with timestamps and semantic errors', async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } }))
    vi.stubGlobal('fetch', fetchMock)

    useIdeaStore.getState().createIdea()
    await Promise.resolve()
    await Promise.resolve()

    expect(useIdeaStore.getState().ideas).toHaveLength(1)
    expect(useIdeaStore.getState().sync).toMatchObject({ syncState: 'failed', pendingCount: 1, lastSyncError: 'offline' })
    expect(useIdeaStore.getState().statusMessage).toBe('sync.failed')

    const flushPromise = useIdeaStore.getState().flushSyncQueue()
    expect(useIdeaStore.getState().sync.syncState).toBe('syncing')
    await flushPromise

    expect(useIdeaStore.getState().sync).toMatchObject({ syncState: 'synced', pendingCount: 0, lastSyncError: null })
    expect(useIdeaStore.getState().sync.lastSyncedAt).toEqual(expect.any(String))
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})
