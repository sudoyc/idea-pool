import {
  Archive,
  ChevronLeft,
  Inbox,
  KanbanSquare,
  Lock,
  LogOut,
  Plus,
  Save,
  Settings,
  Sparkles,
  Tag,
  Trash2,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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

type AuthState = 'checking' | 'authenticated' | 'anonymous'
type AuthMode = 'disabled' | 'password' | 'token'

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
  const activeFilter = useIdeaStore((state) => state.activeFilter)
  const screen = useIdeaStore((state) => state.screen)
  const detailOpen = useIdeaStore((state) => state.detailOpen)
  const selectedIdeaId = useIdeaStore((state) => state.selectedIdeaId)
  const statusMessage = useIdeaStore((state) => state.statusMessage)
  const setActiveFilter = useIdeaStore((state) => state.setActiveFilter)
  const setScreen = useIdeaStore((state) => state.setScreen)
  const closeDetail = useIdeaStore((state) => state.closeDetail)
  const createIdea = useIdeaStore((state) => state.createIdea)
  const moveIdea = useIdeaStore((state) => state.moveIdea)
  const replaceIdeas = useIdeaStore((state) => state.replaceIdeas)
  const [activeDragId, setActiveDragId] = useState<string | null>(null)
  const [authState, setAuthState] = useState<AuthState>('checking')
  const [authMode, setAuthMode] = useState<AuthMode>('password')
  const [authEnabled, setAuthEnabled] = useState(true)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const selectedIdea = ideas.find((idea) => idea.id === selectedIdeaId) ?? ideas[0]
  const activeDragIdea = ideas.find((idea) => idea.id === activeDragId)
  const tags = Array.from(new Set(ideas.flatMap((idea) => idea.tags))).slice(0, 8)

  const loadRemoteIdeas = useCallback(async () => {
    try {
      const response = await fetch('/api/ideas')
      if (!response.ok) return
      const payload = (await response.json()) as { ideas?: WorkbenchIdea[] }
      if (Array.isArray(payload.ideas)) {
        replaceIdeas(payload.ideas)
      }
    } catch {
      // Keep local data if the remote endpoint is unavailable.
    }
  }, [replaceIdeas])

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const response = await fetch('/api/auth/session')
        const payload = (await response.json()) as {
          authEnabled: boolean
          authMode: AuthMode
          authenticated: boolean
        }
        setAuthEnabled(payload.authEnabled)
        setAuthMode(payload.authMode)
        if (payload.authenticated) {
          setAuthState('authenticated')
          await loadRemoteIdeas()
          return
        }
        setAuthState('anonymous')
      } catch {
        setAuthEnabled(false)
        setAuthMode('disabled')
        setAuthState('authenticated')
      }
    }

    void bootstrap()
  }, [loadRemoteIdeas])

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

  useEffect(() => {
    if (!detailOpen || !selectedIdeaId) return
    if (window.history.state?.ideaDetailId === selectedIdeaId) return
    window.history.pushState({ ideaDetailId: selectedIdeaId }, '')
  }, [detailOpen, selectedIdeaId])

  useEffect(() => {
    const onPopState = () => {
      if (detailOpen) {
        closeDetail()
      }
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && detailOpen) {
        event.preventDefault()
        if (window.history.state?.ideaDetailId) {
          window.history.back()
        } else {
          closeDetail()
        }
      }
    }

    window.addEventListener('popstate', onPopState)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('popstate', onPopState)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [closeDetail, detailOpen])

  const handleCloseDetail = () => {
    if (window.history.state?.ideaDetailId) {
      window.history.back()
      return
    }

    closeDetail()
  }

  const handleLogin = async (input: { password?: string; token?: string }) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })

    if (!response.ok) {
      throw new Error('登录失败，请检查密码或 token。')
    }

    const payload = (await response.json()) as { authEnabled: boolean; authMode: AuthMode; authenticated: boolean }
    setAuthEnabled(payload.authEnabled)
    setAuthMode(payload.authMode)
    setAuthState(payload.authenticated ? 'authenticated' : 'anonymous')
    await loadRemoteIdeas()
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    setAuthState(authEnabled ? 'anonymous' : 'authenticated')
  }

  if (authState === 'checking') {
    return <LoadingScreen />
  }

  if (authState === 'anonymous') {
    return <LoginScreen authMode={authMode} onLogin={handleLogin} />
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
                className={`nav-item ${screen === 'WORKBENCH' && activeFilter === item.status ? 'active' : ''}`}
                key={item.status}
                type="button"
                onClick={() => setActiveFilter(item.status)}
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

        <nav className="nav-section nav-section--system" aria-label="System">
          <div className="nav-title">System</div>
            <button
              className={`nav-item ${screen === 'SETTINGS' ? 'active' : ''}`}
              type="button"
              onClick={() => {
                closeDetail()
                setScreen('SETTINGS')
              }}
            >
            <span className="nav-item-left">
              <Settings className="icon" />
              <span>Settings</span>
            </span>
          </button>
        </nav>
      </aside>

      <section className="workspace-wrapper">
        <div className={`workspace-inner ${detailOpen ? 'shrink' : ''}`} id="workspaceInner">
          <div className="topbar">
            <div className="view-title">
              {screen === 'SETTINGS' ? <Settings className="icon" /> : <KanbanSquare className="icon" />}
              {screen === 'SETTINGS' ? 'Settings' : navItems.find((item) => item.status === activeFilter)?.label}
            </div>
            <div className="topbar-actions">
              {statusMessage && <span className="status-message">{statusMessage}</span>}
              {screen === 'WORKBENCH' ? (
                <button className="btn primary" type="button" onClick={createIdea}>
                  <Plus className="icon" />
                  New Seed
                </button>
              ) : (
                <button className="btn" type="button" onClick={() => setScreen('WORKBENCH')}>
                  <KanbanSquare className="icon" />
                  Return to Board
                </button>
              )}
            </div>
          </div>

          {screen === 'WORKBENCH' ? (
            <DndContext
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
              onDragStart={handleDragStart}
              sensors={sensors}
            >
              <div className="workspace-layout">
                <div className="board">
                  {statusOrder.map((status) => (
                    <BoardColumn
                      description={columnDescriptions[status]}
                      focus={activeFilter === status}
                      ideas={ideas.filter((idea) => idea.status === status)}
                      key={status}
                      status={status}
                    />
                  ))}
                </div>
                <InspectorRail activeFilter={activeFilter} idea={selectedIdea} />
              </div>
              <DragOverlay>{activeDragIdea ? <IdeaCard idea={activeDragIdea} overlay /> : null}</DragOverlay>
            </DndContext>
          ) : (
            <SettingsView authEnabled={authEnabled} authMode={authMode} onLogout={handleLogout} />
          )}
        </div>

        {selectedIdea && <DetailView idea={selectedIdea} onClose={handleCloseDetail} />}
      </section>
    </main>
  )
}

function BoardColumn({ description, focus, ideas, status }: { description: string; focus: boolean; ideas: WorkbenchIdea[]; status: IdeaStatus }) {
  const { setNodeRef } = useDroppable({ id: status })

  return (
    <section className={`column ${focus ? 'column--focus' : 'column--muted'}`} ref={setNodeRef}>
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
        <span className="card-source">{idea.source}</span>
      </div>
      <div className="card-submeta">
        <span>{idea.firstAction ?? idea.whyNow}</span>
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

function DetailView({ idea, onClose }: { idea: WorkbenchIdea; onClose: () => void }) {
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
        <button className="btn-back" type="button" onClick={onClose}>
          <ChevronLeft className="icon" />
          Back
        </button>
        <div className="detail-actions">
          <button className="btn" type="button" onClick={discardSelected}>
            <Archive className="icon" />
            Discard
          </button>
          <button className="btn primary" type="button" onClick={() => updateIdea(idea.id, {})}>
            <Save className="icon" />
            Save Changes
          </button>
        </div>
      </div>

      <div className="detail-content">
        <div className="detail-grid">
          <div className="doc doc-main">
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

            <div className="section-title">WHY NOW</div>
            <textarea
              className="editor-box"
              onChange={(event) => updateIdea(idea.id, { whyNow: event.target.value })}
              value={idea.whyNow}
            />

            <div className="section-title">MVP SCOPE</div>
            <textarea
              className="editor-box"
              onChange={(event) => updateIdea(idea.id, { mvpScope: event.target.value })}
              value={idea.mvpScope ?? ''}
            />

            <div className="section-title">FIRST ACTION</div>
            <textarea
              className="editor-box"
              onChange={(event) => updateIdea(idea.id, { firstAction: event.target.value })}
              value={idea.firstAction ?? ''}
            />

            <div className="section-title">SCRATCHPAD (草稿本)</div>
            <textarea
              className="editor-box editor-box--mono"
              onChange={(event) => updateIdea(idea.id, { scratchpad: event.target.value })}
              placeholder="// write some messy thoughts or pseudo code..."
              value={idea.scratchpad}
            />
          </div>

          <aside className="detail-rail">
            <div className="rail-section rail-section--ai">
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
            </div>

            <div className="rail-section">
              <div className="section-title">NOTES / CHECKLIST</div>
              <div className="rail-note">当前 detail 已与 filter 解耦。切换左侧栏位不会主动关闭这张卡片。</div>
              <ul className="rail-list">
                <li>先确认 MVP 是否足够小</li>
                <li>再决定是否需要 LLM 补全</li>
                <li>最后再生成 Agent Pack</li>
              </ul>
            </div>

            <div className="rail-section">
              <div className="section-title">METADATA</div>
              <dl className="meta-list">
                <div><dt>Status</dt><dd>{idea.status}</dd></div>
                <div><dt>Source</dt><dd>{idea.source}</dd></div>
                <div><dt>Updated</dt><dd>{new Date(idea.updatedAt).toLocaleString('zh-CN')}</dd></div>
              </dl>
            </div>
          </aside>
        </div>
      </div>
    </section>
  )
}

function InspectorRail({ activeFilter, idea }: { activeFilter: IdeaStatus; idea?: WorkbenchIdea }) {
  return (
    <aside className="inspector-rail">
      <section className="inspector-card">
        <div className="section-title">FOCUS FILTER</div>
        <h3>{statusLabels[activeFilter]}</h3>
        <p>左侧栏位现在作为过滤器工作，其它列会保留在背景中，避免右侧空间空置。</p>
      </section>

      <section className="inspector-card">
        <div className="section-title">CURRENT SELECTION</div>
        <h3>{idea?.title ?? 'No idea selected'}</h3>
        <p>{idea?.summary ?? '打开一张卡片后，这里可以提供 quick notes、history 和 agent actions。'}</p>
      </section>

      <section className="inspector-card">
        <div className="section-title">NEXT STEPS</div>
        <ul className="inspector-list">
          <li>增加 Notes / Checklist 持久化</li>
          <li>把 inspector 接入真实 idea events</li>
          <li>接入登录态与 remote sync</li>
        </ul>
      </section>
    </aside>
  )
}

function SettingsView({ authEnabled, authMode, onLogout }: { authEnabled: boolean; authMode: AuthMode; onLogout: () => void }) {
  return (
    <section className="settings-view">
      <div className="settings-grid">
        <section className="settings-card settings-card--hero">
          <div className="section-title">GENERAL</div>
          <h2>Personal Idea Workbench</h2>
          <p>这是一个保留概念的 Settings 页面骨架，后续用于承载 AI、Agent API、存储与安全相关配置。</p>
        </section>

        <section className="settings-card">
          <div className="section-title">AI</div>
          <p>当前模式：LLM 只补全选中的 idea，不自动选题、不自动移动卡片。</p>
        </section>

        <section className="settings-card">
          <div className="section-title">AGENT API</div>
          <p>预留 `/api/agent/v1` 的上下文、idea CRUD、completion 和 agent pack 接口。</p>
        </section>

        <section className="settings-card">
          <div className="section-title">STORAGE</div>
          <p>SQLite 保存结构化数据；文件导出与附件保存到 `/data/files`。</p>
        </section>

        <section className="settings-card">
          <div className="section-title">SECURITY</div>
          <p><Lock className="icon settings-inline-icon" /> 当前模式：{authEnabled ? authMode : 'disabled'}。Web 使用 session cookie，agent 使用 Bearer token。</p>
          {authEnabled && (
            <button className="btn settings-action" type="button" onClick={onLogout}>
              <LogOut className="icon" />
              Sign out
            </button>
          )}
        </section>
      </div>
    </section>
  )
}

function LoadingScreen() {
  return (
    <main className="auth-screen">
      <div className="auth-panel auth-panel--loading">
        <div className="brand auth-brand">
          <span className="dot" />
          Workbench
        </div>
        <h1>Checking session</h1>
        <p>正在确认当前工作台的访问权限与本地状态。</p>
      </div>
    </main>
  )
}

function LoginScreen({ authMode, onLogin }: { authMode: AuthMode; onLogin: (input: { password?: string; token?: string }) => Promise<void> }) {
  const [value, setValue] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await onLogin(authMode === 'token' ? { token: value } : { password: value })
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : '登录失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="auth-screen">
      <form className="auth-panel" onSubmit={submit}>
        <div className="brand auth-brand">
          <span className="dot" />
          Workbench
        </div>
        <div className="auth-eyebrow">Private Access</div>
        <h1>Personal Idea Workbench</h1>
        <p>输入{authMode === 'token' ? '访问 token' : '登录密码'}，进入你的个人灵感工作台。</p>
        <label className="auth-label">
          {authMode === 'token' ? 'Access token' : 'Password'}
          <input
            autoFocus
            className="auth-input"
            onChange={(event) => setValue(event.target.value)}
            type={authMode === 'token' ? 'text' : 'password'}
            value={value}
          />
        </label>
        {error && <div className="auth-error">{error}</div>}
        <button className="btn primary auth-submit" disabled={submitting || value.trim().length === 0} type="submit">
          <Lock className="icon" />
          {submitting ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </main>
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
