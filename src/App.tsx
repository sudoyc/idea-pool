import {
  Archive,
  ChevronLeft,
  Circle,
  GalleryVerticalEnd,
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
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import * as React from 'react'
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
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
import { SortableContext, rectSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import './App.css'
import { useI18n } from './i18n/useI18n'
import type { TranslationKey } from './i18n/messages'
import type { Locale } from './i18n/types'
import { defaultWorkbenchSettings, loadWorkbenchSettings, saveWorkbenchSettings, triggerWorkbenchBackup, type WorkbenchSettings } from './settingsClient'
import { resolveDetailShortcut } from './detailKeyboard'
import { getVisibleIdeasForLens, useIdeaStore } from './store/useIdeaStore'
import {
  buildDragClassificationTargets,
  buildIdeaPoolLenses,
  buildSettingsControls,
  buildSettingsReadOnlyItems,
  buildSettingsRuntimeItems,
  buildSettingsBackupAction,
  buildSyncStatusCopy,
  buildWorkspacePoolModelCopy,
  type SettingsControlKey,
} from './workbenchProductModel'
import { statusOrder, type IdeaPoolLens, type IdeaStatus, type WorkbenchIdea } from './workbenchTypes'

type AuthState = 'checking' | 'authenticated' | 'anonymous'
type AuthMode = 'disabled' | 'password' | 'token'
type IdeaFile = { id: string; filename: string; kind: string; sizeBytes?: number }

const lensIcons: Record<IdeaPoolLens, typeof Inbox> = {
  ALL: GalleryVerticalEnd,
  INBOX: Circle,
  PIPELINE: KanbanSquare,
  TRASH: Trash2,
}

const classificationTargetId = (status: IdeaStatus) => `classification:${status}`
const dateTimeLocaleByUiLocale: Record<Locale, string> = { zh: 'zh-CN', en: 'en-US' }
const localeLabelKeys: Record<Locale, TranslationKey> = { zh: 'locale.zh', en: 'locale.en' }
const isTextEntryTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false
  return ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable
}

function App() {
  const { locale, setLocale, t } = useI18n()
  const ideas = useIdeaStore((state) => state.ideas)
  const activeLens = useIdeaStore((state) => state.activeLens)
  const screen = useIdeaStore((state) => state.screen)
  const detailOpen = useIdeaStore((state) => state.detailOpen)
  const selectedIdeaId = useIdeaStore((state) => state.selectedIdeaId)
  const statusMessage = useIdeaStore((state) => state.statusMessage)
  const sync = useIdeaStore((state) => state.sync)
  const flushSyncQueue = useIdeaStore((state) => state.flushSyncQueue)
  const setIdeaPoolLens = useIdeaStore((state) => state.setIdeaPoolLens)
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

  const ideaPoolLenses = useMemo(() => buildIdeaPoolLenses(locale), [locale])
  const dragClassificationTargets = useMemo(() => buildDragClassificationTargets(locale), [locale])
  const syncStatusCopy = useMemo(() => buildSyncStatusCopy(locale), [locale])
  const workspacePoolModelCopy = useMemo(() => buildWorkspacePoolModelCopy(locale), [locale])

  const selectedIdea = ideas.find((idea) => idea.id === selectedIdeaId) ?? ideas[0]
  const activeDragIdea = ideas.find((idea) => idea.id === activeDragId)
  const tags = Array.from(new Set(ideas.flatMap((idea) => idea.tags))).slice(0, 8)
  const visibleIdeas = getVisibleIdeasForLens(ideas, activeLens)
  const activeLensModel = ideaPoolLenses.find((lens) => lens.id === activeLens) ?? ideaPoolLenses[0]
  const previousLensRef = useRef(activeLens)
  const [ideaPoolTransitionMode, setIdeaPoolTransitionMode] = useState<'idle' | 'lens'>('idle')

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
        { ALL: ideas.length } as Record<IdeaPoolLens, number>,
      ),
    [ideas],
  )

  useEffect(() => {
    if (previousLensRef.current === activeLens) return
    previousLensRef.current = activeLens
    setIdeaPoolTransitionMode('lens')
    const timer = window.setTimeout(() => setIdeaPoolTransitionMode('idle'), 520)
    return () => window.clearTimeout(timer)
  }, [activeLens])

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(String(event.active.id))
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const activeId = String(event.active.id)
    const overId = event.over ? String(event.over.id) : null
    setActiveDragId(null)
    if (!overId) return

    const classificationTarget = dragClassificationTargets.find((target) => classificationTargetId(target.status) === overId)
    if (classificationTarget) {
      moveIdea(activeId, classificationTarget.status)
      return
    }

    const movingIdea = ideas.find((idea) => idea.id === activeId)
    const overIdea = ideas.find((idea) => idea.id === overId)
    if (!movingIdea || !overIdea || movingIdea.id === overIdea.id) return
    moveIdea(activeId, movingIdea.status, overIdea.id)
  }

  useEffect(() => {
    if (!window.history.state?.workspaceRoute && !window.history.state?.ideaDetailId) {
      window.history.replaceState({ workspaceRoute: 'workbench' }, '')
    }
  }, [])

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
      const action = resolveDetailShortcut({
        key: event.key,
        ctrlKey: event.ctrlKey,
        metaKey: event.metaKey,
        detailOpen,
        isTextInput: isTextEntryTarget(event.target),
        isComposing: event.isComposing,
      })

      if (action === 'closeDetail') {
        event.preventDefault()
        if (window.history.state?.ideaDetailId) {
          window.history.back()
        } else {
          closeDetail()
        }
        return
      }

      if (action === 'saveDetail') {
        event.preventDefault()
        return
      }

      if (action === 'newSeed') {
        event.preventDefault()
        createIdea()
      }
    }

    window.addEventListener('popstate', onPopState)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('popstate', onPopState)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [closeDetail, createIdea, detailOpen])

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
      throw new Error(t('auth.error.loginFailed'))
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
          {t('app.brand')}
        </div>

        <nav className="nav-section" aria-label={t('nav.poolLenses')}>
          <div className="nav-title">{t('nav.poolLenses')}</div>
          {ideaPoolLenses.map((lens) => {
            const Icon = lensIcons[lens.id]
            return (
              <button
                className={`nav-item ${screen === 'WORKBENCH' && activeLens === lens.id ? 'active' : ''}`}
                key={lens.id}
                type="button"
                title={lens.description}
                onClick={() => setIdeaPoolLens(lens.id)}
              >
                <span className="nav-item-left">
                  <Icon className="icon" />
                  <span>{lens.label}</span>
                </span>
                <span className="count">{counts[lens.id]}</span>
              </button>
            )
          })}
        </nav>

        <nav className="nav-section nav-section--tags" aria-label={t('nav.tags')}>
          <div className="nav-title">{t('nav.tags')}</div>
          <div className="tag-list-nav">
            {tags.map((tag) => (
              <button className="tag-item" key={tag} type="button">
                <Tag className="icon icon-sm" />
                {tag}
              </button>
            ))}
          </div>
        </nav>

        <nav className="nav-section nav-section--system" aria-label={t('nav.system')}>
          <div className="nav-title">{t('nav.system')}</div>
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
              <span>{t('nav.settings')}</span>
            </span>
          </button>
        </nav>
      </aside>

      <section className={`workspace-wrapper ${activeDragId ? 'dragging-card' : ''}`}>
        <div className={`workspace-inner ${detailOpen ? 'shrink' : ''}`} id="workspaceInner">
          <div className="topbar">
            <div className="view-title">
              {screen === 'SETTINGS' ? <Settings className="icon" /> : <GalleryVerticalEnd className="icon" />}
              {screen === 'SETTINGS' ? t('settings.title') : activeLensModel.label}
            </div>
            <div className="topbar-actions">
              <LocaleSwitcher locale={locale} setLocale={setLocale} />
              <span className="topbar-status-slot">{statusMessage ? <span className="status-message">{t(statusMessage)}</span> : null}</span>
              <button className={`sync-chip sync-chip--${sync.syncState}`} title={sync.lastSyncError ?? undefined} type="button" onClick={flushSyncQueue}>
                {syncStatusCopy[sync.syncState]}
                {sync.pendingCount > 0 ? ` (${sync.pendingCount})` : ''}
              </button>
              {screen === 'WORKBENCH' ? (
                <button className="btn primary" type="button" onClick={createIdea}>
                  <Plus className="icon" />
                  {t('action.newSeed')}
                </button>
              ) : (
                <button className="btn" type="button" onClick={() => setScreen('WORKBENCH')}>
                  <KanbanSquare className="icon" />
                  {t('action.returnToWorkbench')}
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
                <IdeaPool
                  ideas={visibleIdeas}
                  lens={activeLensModel}
                  onCreateSeed={createIdea}
                  transitionMode={ideaPoolTransitionMode}
                  totalCount={ideas.length}
                  workspacePoolModelCopy={workspacePoolModelCopy}
                />
              </div>
              <DragClassificationTargets isDragging={Boolean(activeDragId)} />
              {createPortal(
                <DragOverlay>{activeDragIdea ? <IdeaCard idea={activeDragIdea} locale={locale} overlay /> : null}</DragOverlay>,
                document.body,
              )}
            </DndContext>
          ) : (
            <SettingsView authEnabled={authEnabled} authMode={authMode} onLogout={handleLogout} />
          )}
        </div>

        {selectedIdea && <DetailView idea={selectedIdea} locale={locale} onClose={handleCloseDetail} />}
      </section>
    </main>
  )
}

function LocaleSwitcher({ locale, setLocale }: { locale: Locale; setLocale: (locale: Locale) => void }) {
  const { t } = useI18n()
  const [localeMenuOpen, setLocaleMenuOpen] = useState(false)
  const localeOptions: Locale[] = ['zh', 'en']

  const handleLocaleMenuKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      setLocaleMenuOpen(true)
    }
  }

  return (
    <div className="settings-label locale-switcher">
      <span>{t('locale.switcher.label')}</span>
      <DropdownMenu.Root open={localeMenuOpen} onOpenChange={setLocaleMenuOpen}>
        <DropdownMenu.Trigger asChild>
          <button
            aria-expanded={localeMenuOpen}
            aria-label={t('locale.switcher.open')}
            className="settings-input locale-trigger"
            onKeyDown={handleLocaleMenuKeyDown}
            type="button"
          >
            {t(localeLabelKeys[locale])}
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content align="end" className="locale-menu" role="listbox" sideOffset={8}>
            {localeOptions.map((option) => (
              <DropdownMenu.Item
                aria-selected={locale === option}
                className="locale-menu-item"
                key={option}
                onSelect={() => setLocale(option)}
                role="option"
              >
                {t(localeLabelKeys[option])}
              </DropdownMenu.Item>
            ))}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  )
}

function IdeaPool({
  ideas,
  lens,
  onCreateSeed,
  transitionMode,
  totalCount,
  workspacePoolModelCopy,
}: {
  ideas: WorkbenchIdea[]
  lens: ReturnType<typeof buildIdeaPoolLenses>[number]
  onCreateSeed: () => void
  transitionMode: 'idle' | 'lens'
  totalCount: number
  workspacePoolModelCopy: ReturnType<typeof buildWorkspacePoolModelCopy>
}) {
  const { t } = useI18n()

  return (
    <section className="pool-panel" aria-label={t('workbench.pool.aria')}>
      <div className="pool-header">
        <div>
          <div className="pool-kicker">{t('workbench.pool.kicker')}</div>
          <h1 className="pool-title">{lens.label}</h1>
          <p className="pool-subtitle">
            {workspacePoolModelCopy.statusModel} {workspacePoolModelCopy.classification}
          </p>
        </div>
        <div className="pool-tools">
          <span className="chip">{ideas.length} {t('workbench.pool.visibleCount')}</span>
          <span className="chip">{totalCount} {t('workbench.pool.totalCount')}</span>
        </div>
      </div>
      <SortableContext items={ideas.map((idea) => idea.id)} strategy={rectSortingStrategy}>
        <div className="idea-pool pool-transition-surface" data-transition={transitionMode === 'lens' ? 'lens' : undefined}>
          {ideas.map((idea, index) => (
            <SortableIdeaCard idea={idea} key={idea.id} staggerIndex={index} />
          ))}
          {ideas.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-kicker">{lens.label}</div>
              <h2>{t('workbench.empty.title')}</h2>
              <p>{t('workbench.empty.body')}</p>
              <button className="btn primary" type="button" onClick={onCreateSeed}>
                <Plus className="icon" />
                {t('workbench.empty.action')}
              </button>
            </div>
          )}
        </div>
      </SortableContext>
    </section>
  )
}

function DragClassificationTargets({ isDragging }: { isDragging: boolean }) {
  const { locale, t } = useI18n()
  const targets = useMemo(() => buildDragClassificationTargets(locale), [locale])

  return (
    <div className="drag-classification-targets" aria-hidden={!isDragging} aria-label={t('drag.targets.aria')}>
      {targets.map((target) => (
        <DragClassificationTarget key={target.status} target={target} />
      ))}
    </div>
  )
}

function DragClassificationTarget({ target }: { target: ReturnType<typeof buildDragClassificationTargets>[number] }) {
  const { isOver, setNodeRef } = useDroppable({ id: classificationTargetId(target.status) })
  const { t } = useI18n()

  return (
    <section className={`drop-window drop-window--${target.status.toLowerCase()} ${isOver ? 'over' : ''}`} ref={setNodeRef}>
      <div>
        <div className="drop-label">{t('drag.targets.label')}</div>
        <h3>{target.label}</h3>
        <p>{target.description}</p>
      </div>
      <div className="drop-hint">{t('drag.targets.hint')}</div>
    </section>
  )
}

function SortableIdeaCard({ idea, staggerIndex }: { idea: WorkbenchIdea; staggerIndex: number }) {
  const openDetail = useIdeaStore((state) => state.openDetail)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: idea.id })

  return (
    <div
      ref={setNodeRef}
      style={{ '--stagger-index': staggerIndex, transform: CSS.Transform.toString(transform), transition } as React.CSSProperties}
      {...attributes}
      {...listeners}
    >
      <IdeaCard dragging={isDragging} idea={idea} onOpen={() => openDetail(idea.id)} />
    </div>
  )
}

function IdeaCard({
  dragging = false,
  idea,
  onOpen,
  overlay = false,
}: {
  dragging?: boolean
  idea: WorkbenchIdea
  locale?: Locale
  onOpen?: () => void
  overlay?: boolean
}) {
  const { t } = useI18n()
  const statusKey = `idea.status.${idea.status}` as TranslationKey

  return (
    <article
      className={`card ${idea.aiEnriched ? 'ai-card' : ''} ${dragging ? 'dragging' : ''} ${overlay ? 'overlay-card' : ''}`}
      onClick={onOpen}
    >
      <h3>{idea.title}</h3>
      <p>{idea.summary}</p>
      <div className="card-meta">
        <span className="pill">{idea.tags[0] ?? 'seed'}</span>
        <span className="pill status-pill">{t(statusKey)}</span>
      </div>
      <div className="card-submeta">
        <span>{idea.firstAction ?? idea.whyNow}</span>
        {idea.aiEnriched && (
          <span className="pill ai">
            <Sparkles className="icon icon-sm" />
            {t('term.ai')}
          </span>
        )}
      </div>
    </article>
  )
}

function DetailView({ idea, onClose }: { idea: WorkbenchIdea; locale: Locale; onClose: () => void }) {
  const { locale, t } = useI18n()
  const statusKey = `idea.status.${idea.status}` as TranslationKey
  const sourceKey = `idea.source.${idea.source}` as TranslationKey
  const detailOpen = useIdeaStore((state) => state.detailOpen)
  const updateIdea = useIdeaStore((state) => state.updateIdea)
  const enrichIdea = useIdeaStore((state) => state.enrichIdea)
  const discardSelected = useIdeaStore((state) => state.discardSelected)
  const deleteSelectedIdea = useIdeaStore((state) => state.deleteSelectedIdea)
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
          {t('action.back')}
        </button>
        <div className="detail-actions">
          {idea.status === 'TRASH' ? (
            <button className="btn btn-danger" type="button" onClick={deleteSelectedIdea}>
              <Trash2 className="icon" />
              {t('action.deletePermanently')}
            </button>
          ) : (
            <button className="btn" type="button" onClick={discardSelected}>
              <Archive className="icon" />
              {t('action.discard')}
            </button>
          )}
          <button className="btn primary" type="button" onClick={() => updateIdea(idea.id, {})}>
            <Save className="icon" />
            {t('action.saveChanges')}
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

            <input className="title-input" onChange={(event) => updateIdea(idea.id, { title: event.target.value })} type="text" value={idea.title} />
            <textarea className="summary-input" onChange={(event) => updateIdea(idea.id, { summary: event.target.value })} ref={summaryRef} value={idea.summary} />

            <div className="section-title">{t('detail.section.whyNow')}</div>
            <textarea className="editor-box" onChange={(event) => updateIdea(idea.id, { whyNow: event.target.value })} value={idea.whyNow} />

            <div className="section-title">{t('detail.section.mvpScope')}</div>
            <textarea className="editor-box" onChange={(event) => updateIdea(idea.id, { mvpScope: event.target.value })} value={idea.mvpScope ?? ''} />

            <div className="section-title">{t('detail.section.firstAction')}</div>
            <textarea className="editor-box" onChange={(event) => updateIdea(idea.id, { firstAction: event.target.value })} value={idea.firstAction ?? ''} />

            <div className="section-title">{t('detail.section.scratchpad')}</div>
            <textarea
              className="editor-box editor-box--mono"
              onChange={(event) => updateIdea(idea.id, { scratchpad: event.target.value })}
              placeholder={t('detail.scratchpad.placeholder')}
              value={idea.scratchpad}
            />
          </div>

          <aside className="detail-rail">
            <div className="rail-section rail-section--ai">
              <div className="ai-block">
                <div className="ai-header">
                  <span>
                    <Sparkles className="icon" />
                    {t('detail.ai.title')}
                  </span>
                  <button className="btn primary" disabled={aiBusy} type="button" onClick={runAi}>
                    {aiBusy ? t('detail.ai.processing') : idea.aiEnriched ? t('detail.ai.regenerate') : t('detail.ai.generate')}
                  </button>
                </div>
                <AiAnalysisText busy={aiBusy} idea={idea} />
              </div>
            </div>

            <div className="rail-section">
              <FileHandoffPanel ideaId={idea.id} />
            </div>

            <div className="rail-section">
              <div className="section-title">{t('detail.section.metadata')}</div>
              <dl className="meta-list">
                <div><dt>{t('detail.field.status')}</dt><dd>{t(statusKey)}</dd></div>
                <div><dt>{t('detail.field.source')}</dt><dd>{t(sourceKey)}</dd></div>
                <div><dt>{t('detail.field.updated')}</dt><dd>{new Date(idea.updatedAt).toLocaleString(dateTimeLocaleByUiLocale[locale])}</dd></div>
              </dl>
            </div>
          </aside>
        </div>
      </div>
    </section>
  )
}

function FileHandoffPanel({ ideaId }: { ideaId: string }) {
  const { t } = useI18n()
  const [files, setFiles] = useState<IdeaFile[]>([])
  const [content, setContent] = useState('')
  const [filename, setFilename] = useState('agent-handoff.md')
  const filenameInputRef = useRef<HTMLInputElement | null>(null)
  const [messageKey, setMessageKey] = useState<TranslationKey | null>(null)

  const loadFiles = useCallback(async () => {
    try {
      const response = await fetch(`/api/ideas/${ideaId}/files`)
      if (!response.ok) return
      const payload = (await response.json()) as { files?: IdeaFile[] }
      setFiles(payload.files ?? [])
    } catch {
      setMessageKey('detail.files.offline')
    }
  }, [ideaId])
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadFiles()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [loadFiles])

  const upload = async () => {
    if (!content.trim()) return
    const trimmedFilename = (filenameInputRef.current?.value ?? filename).trim()
    if (!trimmedFilename) {
      setMessageKey('detail.files.filenameRequired')
      return
    }
    const response = await fetch(`/api/ideas/${ideaId}/files/content`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: trimmedFilename, kind: 'markdown', mimeType: 'text/markdown', content }),
    })
    if (!response.ok) {
      setMessageKey('detail.files.uploadFailed')
      return
    }
    setContent('')
    setMessageKey('detail.files.uploaded')
    await loadFiles()
  }

  const deleteFile = async (id: string) => {
    const response = await fetch(`/api/files/${id}`, { method: 'DELETE' })
    if (!response.ok) {
      setMessageKey('detail.files.deleteFailed')
      return
    }
    setMessageKey('detail.files.deleted')
    await loadFiles()
  }

  return (
    <div className="file-panel">
      <div className="section-title">{t('detail.files.title')}</div>
      <input
        className="settings-input"
        onChange={(event) => setFilename(event.target.value)}
        onInput={(event) => setFilename(event.currentTarget.value)}
        ref={filenameInputRef}
        type="text"
        value={filename}
      />
      <textarea
        className="editor-box editor-box--compact editor-box--mono"
        onChange={(event) => setContent(event.target.value)}
        placeholder={t('detail.files.placeholder')}
        value={content}
      />
      <button className="btn primary" disabled={!content.trim()} type="button" onClick={upload}>
        {t('action.uploadMarkdown')}
      </button>
      {messageKey && <div className="rail-note file-message">{t(messageKey)}</div>}
      <div className="file-list">
        {files.map((file) => (
          <div className="file-row" key={file.id}>
            <span>{file.filename}</span>
            <div className="file-actions">
              <a className="btn btn-small" href={`/api/files/${file.id}/download`}>
                {t('action.download')}
              </a>
              <button className="btn btn-small" type="button" onClick={() => deleteFile(file.id)}>
                {t('action.delete')}
              </button>
            </div>
          </div>
        ))}
        {files.length === 0 && <div className="rail-note">{t('detail.files.empty')}</div>}
      </div>
    </div>
  )
}

function SettingsView({ authEnabled, authMode, onLogout }: { authEnabled: boolean; authMode: AuthMode; onLogout: () => void }) {
  const { locale, t } = useI18n()
  const settingsControls = useMemo(() => buildSettingsControls(locale), [locale])
  const settingsReadOnlyItems = useMemo(() => buildSettingsReadOnlyItems(locale), [locale])
  const settingsRuntimeItems = useMemo(() => buildSettingsRuntimeItems(locale), [locale])
  const settingsBackupAction = useMemo(() => buildSettingsBackupAction(locale), [locale])
  const [settings, setSettings] = useState<WorkbenchSettings>(defaultWorkbenchSettings)
  const [llmApiKey, setLlmApiKey] = useState('')
  const [saving, setSaving] = useState(false)
  const [backingUp, setBackingUp] = useState(false)
  const [messageKey, setMessageKey] = useState<TranslationKey | null>(null)

  useEffect(() => {
    const loadSettings = async () => {
      const result = await loadWorkbenchSettings()
      setSettings(result.settings)
      if (result.usedDefaults) {
        setMessageKey('settings.localDefaults')
      }
    }
    void loadSettings()
  }, [])

  const saveSettings = async () => {
    setSaving(true)
    setMessageKey(null)
    try {
      const saved = await saveWorkbenchSettings(settings, fetch, llmApiKey.trim() || undefined)
      if (saved) setLlmApiKey('')
      setMessageKey(saved ? 'settings.saved' : 'settings.saveFailed')
    } catch {
      setMessageKey('settings.saveFailed')
    } finally {
      setSaving(false)
    }
  }

  const createBackup = async () => {
    setBackingUp(true)
    setMessageKey(null)
    try {
      const backup = await triggerWorkbenchBackup()
      setMessageKey(backup.ok ? 'settings.backup.created' : 'settings.backup.failed')
    } catch {
      setMessageKey('settings.backup.failed')
    } finally {
      setBackingUp(false)
    }
  }

  const getSettingValue = (key: SettingsControlKey) => {
    if (key === 'llmApiKey') return llmApiKey
    return String(settings[key as keyof WorkbenchSettings] ?? '')
  }
  const updateSettingValue = (key: SettingsControlKey, value: string) => {
    if (key === 'llmApiKey') {
      setLlmApiKey(value)
      return
    }
    setSettings((current) => ({ ...current, [key]: value }))
  }

  return (
    <section className="settings-view settings-view-shell">
      <div className="settings-container">
        <section className="settings-section">
          <div className="section-header">
            <div>
              <div className="section-title">{t('settings.workspaceConfig.title')}</div>
              <p>{t('settings.workspaceConfig.summary')}</p>
            </div>
          </div>
          <div className="settings-form-flow">
            {settingsControls.map((control) => (
              <div className="setting-item" key={control.key}>
                <div className="setting-info">
                  <label className="settings-label" htmlFor={`setting-${control.key}`}>
                    {control.label}
                  </label>
                  <p>{control.description}</p>
                </div>
                <div className="setting-control">
                  {control.input === 'select' ? (
                    <select
                      className="settings-input"
                      id={`setting-${control.key}`}
                      onChange={(event) => updateSettingValue(control.key, event.target.value)}
                      value={getSettingValue(control.key)}
                    >
                      {control.options?.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      className="settings-input"
                      id={`setting-${control.key}`}
                      onChange={(event) => updateSettingValue(control.key, event.target.value)}
                      type={control.input === 'password' ? 'password' : 'text'}
                      value={getSettingValue(control.key)}
                      readOnly={control.readOnlyRuntime}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="settings-actions">
            <button className="btn primary" disabled={saving} type="button" onClick={saveSettings}>
              {saving ? t('action.saving') : t('action.saveSettings')}
            </button>
            <button className="btn secondary" disabled={backingUp} type="button" onClick={createBackup}>
              {backingUp ? t('action.saving') : settingsBackupAction.label}
            </button>
          </div>
          <p className="settings-secret-status">
            LLM API Key: {settings.llmApiKeyConfigured ? settings.llmApiKeyMasked : t('settings.secret.notConfigured')}
          </p>
          <p className="settings-message settings-message--muted">{settingsBackupAction.description}</p>
          {messageKey && <p className="settings-message">{t(messageKey)}</p>}
        </section>

        <section className="settings-section">
          <div className="section-header">
            <div>
              <div className="section-title">{t('settings.systemStatus.title')}</div>
              <p>{t('settings.systemStatus.summary')}</p>
            </div>
            <div className="settings-session-pill">
              {t('settings.session.currentMode')}: {authEnabled ? authMode : t('settings.session.mode.disabled')}
            </div>
          </div>
          <div className="settings-form-flow settings-form-flow--readonly">
            {settingsReadOnlyItems.map((item) => (
              <div className="setting-item" key={item.id}>
                <div className="setting-info">
                  <div className="settings-label">{item.label}</div>
                  <p>{item.description}</p>
                </div>
                <div className="setting-control setting-control--tags">
                  {item.tags.map((tag) => (
                    <code key={tag}>{tag}</code>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="settings-form-flow settings-form-flow--readonly settings-runtime-flow">
            {settingsRuntimeItems.map((item) => (
              <div className="setting-item" key={item.id}>
                <div className="setting-info">
                  <div className="settings-label">{item.label}</div>
                  <p>{item.description}</p>
                </div>
                <div className="setting-control setting-control--tags">
                  {item.tags.map((tag) => (
                    <code key={tag}>{tag}</code>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {authEnabled && (
            <button className="btn settings-action" type="button" onClick={onLogout}>
              <LogOut className="icon" />
              {t('action.signOut')}
            </button>
          )}
        </section>
      </div>
    </section>
  )
}

function LoadingScreen() {
  const { t } = useI18n()

  return (
    <main className="auth-screen">
      <div className="auth-panel auth-panel--loading">
        <div className="brand auth-brand">
          <span className="dot" />
          {t('app.brand')}
        </div>
        <h1>{t('loading.title')}</h1>
        <p>{t('loading.body')}</p>
      </div>
    </main>
  )
}

function LoginScreen({ authMode, onLogin }: { authMode: AuthMode; onLogin: (input: { password?: string; token?: string }) => Promise<void> }) {
  const { t } = useI18n()
  const [value, setValue] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await onLogin(authMode === 'token' ? { token: value } : { password: value })
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : t('auth.error.generic'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="auth-screen">
      <form className="auth-panel" onSubmit={submit}>
        <div className="brand auth-brand">
          <span className="dot" />
          {t('app.brand')}
        </div>
        <div className="auth-eyebrow">{t('auth.privateAccess')}</div>
        <h1>{t('auth.title')}</h1>
        <p>{authMode === 'token' ? t('auth.prompt.token') : t('auth.prompt.password')}</p>
        <label className="auth-label">
          {authMode === 'token' ? t('auth.tokenLabel') : t('auth.passwordLabel')}
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
          {submitting ? t('action.signingIn') : t('auth.submit')}
        </button>
      </form>
    </main>
  )
}

function AiAnalysisText({ busy, idea }: { busy: boolean; idea: WorkbenchIdea }) {
  const { t } = useI18n()

  if (busy) {
    return <div className="ai-text ai-text--loading">{t('detail.ai.loading')}</div>
  }

  if (!idea.aiAnalysis) {
    return <div className="ai-text">{t('detail.ai.empty')}</div>
  }

  return (
    <div className="ai-text">
      <ul>
        <li>
          <b>{t('detail.ai.mvpSuggestion')}</b>
          {idea.aiAnalysis.mvpSuggestion}
        </li>
        <li>
          <b>{t('detail.ai.risks')}</b>
          {idea.aiAnalysis.risks.join('；')}
        </li>
        <li>
          <b>{t('detail.ai.firstActions')}</b>
          {idea.aiAnalysis.firstActions.join(' / ')}
        </li>
      </ul>
    </div>
  )
}

export default App
