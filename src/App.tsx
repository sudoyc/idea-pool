import {
  Archive,
  ChevronLeft,
  Inbox,
  KanbanSquare,
  Plus,
  Save,
  Sparkles,
  Tag,
  Trash2,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import './App.css'
import { useIdeaStore } from './store/useIdeaStore'
import { statusLabels, statusOrder, type IdeaStatus, type WorkbenchIdea } from './workbenchTypes'

const navItems: Array<{ label: string; status: IdeaStatus; icon: typeof Inbox }> = [
  { label: 'Inbox', status: 'INBOX', icon: Inbox },
  { label: 'Pipeline', status: 'PIPELINE', icon: KanbanSquare },
  { label: 'Trash', status: 'TRASH', icon: Trash2 },
]

const columnDescriptions: Record<IdeaStatus, string> = {
  INBOX: 'local drafts',
  PIPELINE: 'completed by AI',
  TRASH: 'discarded',
}

function App() {
  const ideas = useIdeaStore((state) => state.ideas)
  const activeView = useIdeaStore((state) => state.activeView)
  const detailOpen = useIdeaStore((state) => state.detailOpen)
  const selectedIdeaId = useIdeaStore((state) => state.selectedIdeaId)
  const statusMessage = useIdeaStore((state) => state.statusMessage)
  const setActiveView = useIdeaStore((state) => state.setActiveView)
  const createIdea = useIdeaStore((state) => state.createIdea)
  const moveIdea = useIdeaStore((state) => state.moveIdea)
  const [activeDragId, setActiveDragId] = useState<string | null>(null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const selectedIdea = ideas.find((idea) => idea.id === selectedIdeaId) ?? ideas[0]
  const activeDragIdea = ideas.find((idea) => idea.id === activeDragId)
  const visibleStatuses = activeView === 'ALL' ? statusOrder : statusOrder.filter((status) => status === activeView)
  const tags = Array.from(new Set(ideas.flatMap((idea) => idea.tags))).slice(0, 8)

  const counts = useMemo(
    () =>
      statusOrder.reduce(
        (result, status) => ({ ...result, [status]: ideas.filter((idea) => idea.status === status).length }),
        {} as Record<IdeaStatus, number>,
      ),
    [ideas],
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(String(event.active.id))
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const activeId = String(event.active.id)
    const overId = event.over ? String(event.over.id) : null
    setActiveDragId(null)
    if (!overId) return

    const overIdea = ideas.find((idea) => idea.id === overId)
    const overStatus = statusOrder.includes(overId as IdeaStatus) ? (overId as IdeaStatus) : overIdea?.status
    if (!overStatus) return
    moveIdea(activeId, overStatus, overIdea?.id)
  }

  return (
    <main className="app">
      <aside className="sidebar">
        <div className="brand">
          <span className="dot" />
          Workbench
        </div>

        <nav className="nav-section" aria-label="Views">
          <div className="nav-title">Views</div>
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                className={`nav-item ${activeView === item.status ? 'active' : ''}`}
                key={item.status}
                type="button"
                onClick={() => setActiveView(item.status)}
              >
                <span className="nav-item-left">
                  <Icon className="icon" />
                  <span>{item.label}</span>
                </span>
                <span className="count">{counts[item.status]}</span>
              </button>
            )
          })}
        </nav>

        <nav className="nav-section nav-section--tags" aria-label="Tags">
          <div className="nav-title">Tags</div>
          <div className="tag-list-nav">
            {tags.map((tag) => (
              <button className="tag-item" key={tag} type="button">
                <Tag className="icon icon-sm" />
                {tag}
              </button>
            ))}
          </div>
        </nav>
      </aside>

      <section className="workspace-wrapper">
        <div className={`workspace-inner ${detailOpen ? 'shrink' : ''}`} id="workspaceInner">
          <div className="topbar">
            <div className="view-title">
              <KanbanSquare className="icon" />
              {activeView === 'ALL' ? 'Pipeline' : navItems.find((item) => item.status === activeView)?.label}
            </div>
            <div className="topbar-actions">
              {statusMessage && <span className="status-message">{statusMessage}</span>}
              <button className="btn primary" type="button" onClick={createIdea}>
                <Plus className="icon" />
                New Seed
              </button>
            </div>
          </div>

          <DndContext
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            onDragStart={handleDragStart}
            sensors={sensors}
          >
            <div className="board">
              {visibleStatuses.map((status) => (
                <BoardColumn
                  description={columnDescriptions[status]}
                  ideas={ideas.filter((idea) => idea.status === status)}
                  key={status}
                  status={status}
                />
              ))}
            </div>
            <DragOverlay>{activeDragIdea ? <IdeaCard idea={activeDragIdea} overlay /> : null}</DragOverlay>
          </DndContext>
        </div>

        {selectedIdea && <DetailView idea={selectedIdea} />}
      </section>
    </main>
  )
}

function BoardColumn({ description, ideas, status }: { description: string; ideas: WorkbenchIdea[]; status: IdeaStatus }) {
  const { setNodeRef } = useDroppable({ id: status })

  return (
    <section className="column" ref={setNodeRef}>
      <div className="col-header">
        <div>
          <span className="col-title">{statusLabels[status]}</span>
          <span className="col-description">{description}</span>
        </div>
        <span className="count">{ideas.length}</span>
      </div>
      <SortableContext items={ideas.map((idea) => idea.id)} strategy={verticalListSortingStrategy}>
        <div className="column-body">
          {ideas.map((idea) => (
            <SortableIdeaCard idea={idea} key={idea.id} />
          ))}
        </div>
      </SortableContext>
    </section>
  )
}

function SortableIdeaCard({ idea }: { idea: WorkbenchIdea }) {
  const openDetail = useIdeaStore((state) => state.openDetail)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: idea.id })
  const style = { transform: CSS.Transform.toString(transform), transition }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <IdeaCard dragging={isDragging} idea={idea} onOpen={() => openDetail(idea.id)} />
    </div>
  )
}

function IdeaCard({ dragging = false, idea, onOpen, overlay = false }: { dragging?: boolean; idea: WorkbenchIdea; onOpen?: () => void; overlay?: boolean }) {
  return (
    <article
      className={`card ${idea.aiEnriched ? 'ai-card' : ''} ${dragging ? 'dragging' : ''} ${overlay ? 'overlay-card' : ''}`}
      onClick={onOpen}
    >
      <h3>{idea.title}</h3>
      <p>{idea.summary}</p>
      <div className="card-meta">
        <span className="pill">{idea.tags[0] ?? 'seed'}</span>
        {idea.aiEnriched && (
          <span className="pill ai">
            <Sparkles className="icon icon-sm" />
            AI
          </span>
        )}
      </div>
    </article>
  )
}

function DetailView({ idea }: { idea: WorkbenchIdea }) {
  const closeDetail = useIdeaStore((state) => state.closeDetail)
  const detailOpen = useIdeaStore((state) => state.detailOpen)
  const updateIdea = useIdeaStore((state) => state.updateIdea)
  const enrichIdea = useIdeaStore((state) => state.enrichIdea)
  const discardSelected = useIdeaStore((state) => state.discardSelected)
  const [aiBusy, setAiBusy] = useState(false)
  const summaryRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    const node = summaryRef.current
    if (!node) return
    node.style.height = ''
    node.style.height = `${node.scrollHeight}px`
  }, [idea.id, idea.summary, detailOpen])

  const runAi = async () => {
    setAiBusy(true)
    try {
      const response = await fetch(`/api/ideas/${idea.id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea }),
      })

      if (response.ok) {
        const payload = (await response.json()) as { aiAnalysis?: WorkbenchIdea['aiAnalysis'] }
        if (payload.aiAnalysis) {
          enrichIdea(idea.id, payload.aiAnalysis)
          return
        }
      }
    } catch {
      // Local fallback keeps the UI usable before the API is configured.
    }

    window.setTimeout(() => {
      enrichIdea(idea.id)
      setAiBusy(false)
    }, 700)
  }

  useEffect(() => {
    if (!aiBusy) return
    const timer = window.setTimeout(() => setAiBusy(false), 1200)
    return () => window.clearTimeout(timer)
  }, [aiBusy, idea.aiAnalysis])

  return (
    <section className={`detail-view ${detailOpen ? 'open' : ''}`} id="detailView">
      <div className="detail-topbar">
        <button className="btn-back" type="button" onClick={closeDetail}>
          <ChevronLeft className="icon" />
          Back
        </button>
        <div className="detail-actions">
          <button className="btn" type="button" onClick={discardSelected}>
            <Archive className="icon" />
            Discard
          </button>
          <button className="btn primary" type="button" onClick={closeDetail}>
            <Save className="icon" />
            Save Changes
          </button>
        </div>
      </div>

      <div className="detail-content">
        <div className="doc">
          <div className="detail-tags">
            {idea.tags.map((tag) => (
              <span className="pill" key={tag}>
                # {tag}
              </span>
            ))}
          </div>

          <input
            className="title-input"
            onChange={(event) => updateIdea(idea.id, { title: event.target.value })}
            type="text"
            value={idea.title}
          />
          <textarea
            className="summary-input"
            onChange={(event) => updateIdea(idea.id, { summary: event.target.value })}
            ref={summaryRef}
            value={idea.summary}
          />

          <div className="ai-block">
            <div className="ai-header">
              <span>
                <Sparkles className="icon" />
                AI 维度扩展
              </span>
              <button className="btn primary" disabled={aiBusy} type="button" onClick={runAi}>
                {aiBusy ? 'Processing...' : idea.aiEnriched ? 'Re-generate' : '生成边界评估'}
              </button>
            </div>
            <AiAnalysisText busy={aiBusy} idea={idea} />
          </div>

          <div className="section-title">WHY NOW</div>
          <textarea
            className="editor-box"
            onChange={(event) => updateIdea(idea.id, { whyNow: event.target.value })}
            value={idea.whyNow}
          />

          <div className="section-title">SCRATCHPAD (草稿本)</div>
          <textarea
            className="editor-box editor-box--mono"
            onChange={(event) => updateIdea(idea.id, { scratchpad: event.target.value })}
            placeholder="// write some messy thoughts or pseudo code..."
            value={idea.scratchpad}
          />
        </div>
      </div>
    </section>
  )
}

function AiAnalysisText({ busy, idea }: { busy: boolean; idea: WorkbenchIdea }) {
  if (busy) {
    return <div className="ai-text ai-text--loading">正在分析知识库与技术边界...</div>
  }

  if (!idea.aiAnalysis) {
    return (
      <div className="ai-text">
        当前灵感处于早期。让 AI 辅助评估核心边界，补全前 30 分钟的行动指南与潜在的范围蔓延风险。
      </div>
    )
  }

  return (
    <div className="ai-text">
      <ul>
        <li>
          <b>MVP 建议：</b>
          {idea.aiAnalysis.mvpSuggestion}
        </li>
        <li>
          <b>风险警示：</b>
          {idea.aiAnalysis.risks.join('；')}
        </li>
        <li>
          <b>前 30 分钟：</b>
          {idea.aiAnalysis.firstActions.join(' / ')}
        </li>
      </ul>
    </div>
  )
}

export default App
