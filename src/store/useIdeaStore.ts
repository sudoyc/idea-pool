import { arrayMove } from '@dnd-kit/sortable'
import { create } from 'zustand'
import { createDefaultAnalysis, createInitialWorkbenchIdeas } from '../data/workbenchIdeas'
import { t, type TranslationKey } from '../i18n/messages'
import { resolveInitialLocale } from '../i18n/localeStore'
import type { AiAnalysis, IdeaPatch, IdeaPoolLens, IdeaStatus, WorkbenchIdea, WorkspaceScreen } from '../workbenchTypes'

const storageKey = 'personal-idea-workbench:v1'

type SyncStatus = 'idle' | 'queued' | 'syncing' | 'synced' | 'error'
type StatusMessageKey = Extract<TranslationKey, `status.${string}` | `sync.${string}`>

type IdeaState = {
  ideas: WorkbenchIdea[]
  selectedIdeaId: string | null
  detailOpen: boolean
  activeFilter: IdeaStatus
  activeLens: IdeaPoolLens
  screen: WorkspaceScreen
  statusMessage: StatusMessageKey | null
  sync: SyncState
  syncQueue: SyncQueueItem[]
  openDetail: (id: string) => void
  closeDetail: () => void
  replaceIdeas: (ideas: WorkbenchIdea[]) => void
  createIdea: () => void
  updateIdea: (id: string, patch: IdeaPatch) => void
  moveIdea: (id: string, status: IdeaStatus, overId?: string) => void
  setActiveFilter: (view: IdeaStatus) => void
  setIdeaPoolLens: (lens: IdeaPoolLens) => void
  setScreen: (screen: WorkspaceScreen) => void
  enrichIdea: (id: string, analysis?: AiAnalysis) => void
  discardSelected: () => void
  setStatusMessage: (message: StatusMessageKey | null) => void
  queueRemoteWrite: (endpoint: string, init: SyncQueueItem['init'], successMessage?: StatusMessageKey) => Promise<void>
  flushSyncQueue: () => Promise<void>
}

type SyncState = {
  status: SyncStatus
  pendingCount: number
  lastError: string | null
  lastSyncedAt: string | null
}

type SyncQueueItem = {
  id: string
  endpoint: string
  init: Pick<RequestInit, 'method' | 'headers' | 'body'>
  createdAt: string
}

const createId = () => `idea-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

const timestamp = () => new Date().toISOString()

const getCurrentLocale = () => resolveInitialLocale()

const getSeedIdeas = () => createInitialWorkbenchIdeas(getCurrentLocale())

const getMovedStatusMessageKey = (status: IdeaStatus): StatusMessageKey => `status.movedTo.${status}` as StatusMessageKey

const loadIdeas = () => {
  if (typeof window === 'undefined') return getSeedIdeas()

  try {
    const raw = window.localStorage.getItem(storageKey)
    if (!raw) return getSeedIdeas()
    const parsed = JSON.parse(raw) as WorkbenchIdea[]
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : getSeedIdeas()
  } catch {
    return getSeedIdeas()
  }
}

const persistIdeas = (ideas: WorkbenchIdea[]) => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(storageKey, JSON.stringify(ideas))
}

// Keep the source contract explicit: 主视图保持为单一 idea pool
const defaultAnalysis = (): AiAnalysis => createDefaultAnalysis(getCurrentLocale())

const initialSyncState: SyncState = { status: 'idle', pendingCount: 0, lastError: null, lastSyncedAt: null }

const createSyncItem = (endpoint: string, init: SyncQueueItem['init']): SyncQueueItem => ({
  id: `sync-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
  endpoint,
  init,
  createdAt: timestamp(),
})

const remoteWrite = async (endpoint: string, init: SyncQueueItem['init']) => {
  const response = await fetch(endpoint, init)
  if (!response.ok) {
    throw new Error(`Remote write failed: ${response.status}`)
  }
}

export const getVisibleIdeasForLens = (ideas: WorkbenchIdea[], lens: IdeaPoolLens) =>
  lens === 'ALL' ? ideas : ideas.filter((idea) => idea.status === lens)

export const useIdeaStore = create<IdeaState>((set, get) => ({
  ideas: loadIdeas(),
  selectedIdeaId: null,
  detailOpen: false,
  activeFilter: 'PIPELINE',
  activeLens: 'ALL',
  screen: 'WORKBENCH',
  statusMessage: null,
  sync: initialSyncState,
  syncQueue: [],
  openDetail: (id) => set({ selectedIdeaId: id, detailOpen: true }),
  closeDetail: () => set({ detailOpen: false }),
  replaceIdeas: (ideas) => {
    persistIdeas(ideas)
    set({ ideas })
  },
  createIdea: () => {
    const now = timestamp()
    const locale = getCurrentLocale()
    const idea: WorkbenchIdea = {
      id: createId(),
      title: t(locale, 'idea.new.title'),
      summary: t(locale, 'idea.new.summary'),
      status: 'INBOX',
      source: 'local',
      tags: ['seed'],
      whyNow: t(locale, 'idea.new.whyNow'),
      mvpScope: '',
      firstAction: '',
      scratchpad: '',
      aiEnriched: false,
      sortOrder: 0,
      createdAt: now,
      updatedAt: now,
    }
    const ideas = [idea, ...get().ideas]
    persistIdeas(ideas)
    const successMessage: StatusMessageKey = 'status.newSeedCreated'
    set({ ideas, selectedIdeaId: idea.id, detailOpen: true, statusMessage: successMessage })
    void get().queueRemoteWrite(
      '/api/ideas',
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(idea) },
      successMessage,
    )
  },
  updateIdea: (id, patch) => {
    const ideas = get().ideas.map((idea) => (idea.id === id ? { ...idea, ...patch, updatedAt: timestamp() } : idea))
    persistIdeas(ideas)
    set({ ideas })
    void get().queueRemoteWrite(`/api/ideas/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
  },
  moveIdea: (id, status, overId) => {
    const movedMessage = getMovedStatusMessageKey(status)
    const current = get().ideas
    const moving = current.find((idea) => idea.id === id)
    if (!moving) return

    const updatedMoving = { ...moving, status, updatedAt: timestamp() }
    const withoutMoving = current.filter((idea) => idea.id !== id)
    const next = [...withoutMoving, updatedMoving]

    if (overId) {
      const oldIndex = next.findIndex((idea) => idea.id === id)
      const newIndex = next.findIndex((idea) => idea.id === overId)
      const reordered = oldIndex >= 0 && newIndex >= 0 ? arrayMove(next, oldIndex, newIndex) : next
      persistIdeas(reordered)
      set({ ideas: reordered, statusMessage: movedMessage })
      void get().queueRemoteWrite(
        `/api/ideas/${id}`,
        { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) },
        movedMessage,
      )
      return
    }

    persistIdeas(next)
    set({ ideas: next, statusMessage: movedMessage })
    void get().queueRemoteWrite(
      `/api/ideas/${id}`,
      { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) },
      movedMessage,
    )
  },
  setActiveFilter: (activeFilter) => set({ activeFilter, activeLens: activeFilter, screen: 'WORKBENCH' }),
  setIdeaPoolLens: (activeLens) => set({ activeLens, screen: 'WORKBENCH' }),
  setScreen: (screen) => set({ screen }),
  enrichIdea: (id, analysis = defaultAnalysis()) => {
    const ideas = get().ideas.map((idea) =>
      idea.id === id
        ? { ...idea, aiEnriched: true, aiAnalysis: analysis, status: 'PIPELINE' as const, updatedAt: timestamp() }
        : idea,
    )
    persistIdeas(ideas)
    const successMessage: StatusMessageKey = 'status.aiAnalysisMerged'
    set({ ideas, statusMessage: successMessage })
    void get().queueRemoteWrite(
      `/api/ideas/${id}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aiEnriched: true, aiAnalysis: analysis, status: 'PIPELINE' }),
      },
      successMessage,
    )
  },
  discardSelected: () => {
    const selectedIdeaId = get().selectedIdeaId
    if (!selectedIdeaId) return
    get().updateIdea(selectedIdeaId, { status: 'TRASH' })
    set({ detailOpen: false, statusMessage: 'status.movedTo.TRASH' })
  },
  setStatusMessage: (message) => set({ statusMessage: message }),
  queueRemoteWrite: async (endpoint, init, successMessage) => {
    try {
      await remoteWrite(endpoint, init)
      set({
        sync: { status: 'synced', pendingCount: get().syncQueue.length, lastError: null, lastSyncedAt: timestamp() },
        statusMessage: successMessage ?? get().statusMessage,
      })
    } catch (error) {
      const syncQueue = [...get().syncQueue, createSyncItem(endpoint, init)]
      set({
        syncQueue,
        sync: {
          status: 'queued',
          pendingCount: syncQueue.length,
          lastError: error instanceof Error ? error.message : 'Remote sync failed',
          lastSyncedAt: get().sync.lastSyncedAt,
        },
        statusMessage: 'sync.queued',
      })
    }
  },
  flushSyncQueue: async () => {
    const queue = get().syncQueue
    if (queue.length === 0) {
      set({ sync: { status: 'synced', pendingCount: 0, lastError: null, lastSyncedAt: timestamp() } })
      return
    }

    set({ sync: { ...get().sync, status: 'syncing', pendingCount: queue.length, lastError: null } })

    for (const item of queue) {
      try {
        await remoteWrite(item.endpoint, item.init)
        const syncQueue = get().syncQueue.filter((queued) => queued.id !== item.id)
        set({ syncQueue, sync: { status: 'syncing', pendingCount: syncQueue.length, lastError: null, lastSyncedAt: get().sync.lastSyncedAt } })
      } catch (error) {
        const syncQueue = get().syncQueue
        set({
          sync: {
            status: 'error',
            pendingCount: syncQueue.length,
            lastError: error instanceof Error ? error.message : 'Remote sync failed',
            lastSyncedAt: get().sync.lastSyncedAt,
          },
          statusMessage: 'sync.error',
        })
        return
      }
    }

    set({ sync: { status: 'synced', pendingCount: 0, lastError: null, lastSyncedAt: timestamp() }, statusMessage: 'sync.synced' })
  },
}))
