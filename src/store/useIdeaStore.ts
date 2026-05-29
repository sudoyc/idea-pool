import { arrayMove } from '@dnd-kit/sortable'
import { create } from 'zustand'
import { initialWorkbenchIdeas } from '../data/workbenchIdeas'
import type { AiAnalysis, IdeaPatch, IdeaStatus, WorkbenchIdea, WorkspaceScreen } from '../workbenchTypes'

const storageKey = 'personal-idea-workbench:v1'

type IdeaState = {
  ideas: WorkbenchIdea[]
  selectedIdeaId: string | null
  detailOpen: boolean
  activeFilter: IdeaStatus
  screen: WorkspaceScreen
  statusMessage: string
  openDetail: (id: string) => void
  closeDetail: () => void
  replaceIdeas: (ideas: WorkbenchIdea[]) => void
  createIdea: () => void
  updateIdea: (id: string, patch: IdeaPatch) => void
  moveIdea: (id: string, status: IdeaStatus, overId?: string) => void
  setActiveFilter: (view: IdeaStatus) => void
  setScreen: (screen: WorkspaceScreen) => void
  enrichIdea: (id: string, analysis?: AiAnalysis) => void
  discardSelected: () => void
  setStatusMessage: (message: string) => void
}

const createId = () => `idea-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

const timestamp = () => new Date().toISOString()

const loadIdeas = () => {
  if (typeof window === 'undefined') return initialWorkbenchIdeas

  try {
    const raw = window.localStorage.getItem(storageKey)
    if (!raw) return initialWorkbenchIdeas
    const parsed = JSON.parse(raw) as WorkbenchIdea[]
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : initialWorkbenchIdeas
  } catch {
    return initialWorkbenchIdeas
  }
}

const persistIdeas = (ideas: WorkbenchIdea[]) => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(storageKey, JSON.stringify(ideas))
}

const defaultAnalysis: AiAnalysis = {
  mvpSuggestion: '抛弃复杂账户系统，首版聚焦 local-first Kanban、详情编辑和单条 idea 的边界评估。',
  risks: ['容易过度设计分类标签', 'LLM 补全文案可能让范围变大'],
  firstActions: ['保留 Inbox、Pipeline、Trash 三个状态', '先让详情页编辑和保存稳定', '再接入后端 completion endpoint'],
  boundaryNotes: '建议把 LLM 输出作为 draft，用户通过 notes/checklist 做最终判断。',
}

const syncCreate = async (idea: WorkbenchIdea) => {
  try {
    await fetch('/api/ideas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(idea),
    })
  } catch {
    // Keep local-first fallback when the API is unavailable.
  }
}

const syncPatch = async (id: string, patch: IdeaPatch) => {
  try {
    await fetch(`/api/ideas/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
  } catch {
    // Keep local-first fallback when the API is unavailable.
  }
}

export const useIdeaStore = create<IdeaState>((set, get) => ({
  ideas: loadIdeas(),
  selectedIdeaId: null,
  detailOpen: false,
  activeFilter: 'PIPELINE',
  screen: 'WORKBENCH',
  statusMessage: '',
  openDetail: (id) => set({ selectedIdeaId: id, detailOpen: true }),
  closeDetail: () => set({ detailOpen: false }),
  replaceIdeas: (ideas) => {
    persistIdeas(ideas)
    set({ ideas })
  },
  createIdea: () => {
    const now = timestamp()
    const idea: WorkbenchIdea = {
      id: createId(),
      title: 'Untitled Seed',
      summary: '写下一条还没有被 AI 补全的本地灵感。',
      status: 'INBOX',
      source: 'local',
      tags: ['seed'],
      whyNow: '为什么现在值得做？',
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
    void syncCreate(idea)
    set({ ideas, selectedIdeaId: idea.id, detailOpen: true, statusMessage: 'New seed created' })
  },
  updateIdea: (id, patch) => {
    const ideas = get().ideas.map((idea) => (idea.id === id ? { ...idea, ...patch, updatedAt: timestamp() } : idea))
    persistIdeas(ideas)
    void syncPatch(id, patch)
    set({ ideas })
  },
  moveIdea: (id, status, overId) => {
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
      void syncPatch(id, { status })
      set({ ideas: reordered, statusMessage: `Moved to ${status}` })
      return
    }

    persistIdeas(next)
    void syncPatch(id, { status })
    set({ ideas: next, statusMessage: `Moved to ${status}` })
  },
  setActiveFilter: (activeFilter) => set({ activeFilter, screen: 'WORKBENCH' }),
  setScreen: (screen) => set({ screen }),
  enrichIdea: (id, analysis = defaultAnalysis) => {
    const ideas = get().ideas.map((idea) =>
      idea.id === id
        ? { ...idea, aiEnriched: true, aiAnalysis: analysis, status: 'PIPELINE' as const, updatedAt: timestamp() }
        : idea,
    )
    persistIdeas(ideas)
    void syncPatch(id, { aiEnriched: true, aiAnalysis: analysis, status: 'PIPELINE' })
    set({ ideas, statusMessage: 'AI analysis merged' })
  },
  discardSelected: () => {
    const selectedIdeaId = get().selectedIdeaId
    if (!selectedIdeaId) return
    get().updateIdea(selectedIdeaId, { status: 'TRASH' })
    set({ detailOpen: false, statusMessage: 'Moved to Trash' })
  },
  setStatusMessage: (message) => set({ statusMessage: message }),
}))
