import 'dotenv/config'
import express from 'express'
import { existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import type { RequestHandler } from 'express'
import { assertAuthConfiguration, login, logout, requireAgentToken, requireSession, requireSessionOrToken, session } from './auth.js'
import {
  createFileMetadata,
  deleteFileMetadata,
  deleteIdea,
  getFile,
  getIdea,
  getSetting,
  listFiles,
  listIdeaEvents,
  listIdeas,
  listAiCompletions,
  patchIdea,
  recordAiCompletion,
  recordIdeaEvent,
  setSetting,
  upsertIdea,
} from './db.js'
import { completeIdea } from './llm.js'
import { deleteStoredFile, filesDir, isSafeFilename, readStoredFile, writeStoredFile } from './storage.js'
import type { AiAnalysis, IdeaRecord, IdeaSource, IdeaStatus } from './types.js'

const port = Number(process.env.PORT ?? 3000)

const ideaStatuses: IdeaStatus[] = ['INBOX', 'PIPELINE', 'TRASH']
const ideaSources: IdeaSource[] = ['local', 'agent', 'import', 'llm']
const fileKinds = ['attachment', 'export', 'agent_pack', 'markdown', 'image']
const settingsSchemaVersion = 2
const settingsDefaults = {
  schemaVersion: settingsSchemaVersion,
  workspaceName: 'Personal Idea Workbench',
  llmModel: process.env.LLM_MODEL ?? 'fallback',
  embeddingModel: process.env.EMBEDDING_MODEL ?? 'text-embedding-3-small',
  storagePath: process.env.IDEA_POOL_STORAGE_PATH ?? filesDir(),
  agentBasePath: '/api/agent/v1',
  agentExposure: 'private',
}
const editableSettings = ['workspaceName', 'llmModel', 'embeddingModel', 'storagePath', 'agentExposure'] as const
const routeParam = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? ''

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'idea'

const buildIdea = (body: Partial<IdeaRecord>, source: IdeaSource) => {
  const now = new Date().toISOString()
  return {
    id: body.id ?? `idea-${Date.now().toString(36)}`,
    title: body.title ?? 'Untitled Seed',
    summary: body.summary ?? '',
    status: body.status ?? 'INBOX',
    source,
    tags: body.tags ?? ['seed'],
    whyNow: body.whyNow ?? '',
    mvpScope: body.mvpScope,
    firstAction: body.firstAction,
    scratchpad: body.scratchpad ?? '',
    aiEnriched: body.aiEnriched ?? false,
    aiAnalysis: body.aiAnalysis,
    sortOrder: body.sortOrder ?? 0,
    createdAt: body.createdAt ?? now,
    updatedAt: now,
    archivedAt: body.archivedAt ?? null,
  } satisfies IdeaRecord
}

const completeAndPersistIdea = async (idea: IdeaRecord, notes?: string) => {
  const aiAnalysis = await completeIdea(idea, notes)
  const updated = patchIdea(idea.id, { aiAnalysis, aiEnriched: true, status: 'PIPELINE' }) ?? { ...idea, aiAnalysis, aiEnriched: true }

  recordAiCompletion({
    ideaId: idea.id,
    provider: process.env.LLM_API_KEY ? 'remote' : 'local',
    model: process.env.LLM_MODEL ?? (process.env.LLM_API_KEY ? 'gpt-4o-mini' : 'fallback'),
    input: { idea, notes: notes ?? '' },
    output: aiAnalysis,
    status: 'succeeded',
  })
  recordIdeaEvent({
    ideaId: idea.id,
    type: 'completed_by_llm',
    actor: 'llm',
    payload: { status: 'succeeded' },
  })

  return { idea: updated, aiAnalysis }
}

const buildAgentPackMarkdown = (idea: IdeaRecord, aiAnalysis?: AiAnalysis) => {
  const analysis = aiAnalysis ?? idea.aiAnalysis
  const lines = [
    `# ${idea.title}`,
    '',
    '## Workbench Context',
    'Local-first Kanban + Spatial Detail View + AI Augmentation',
    '',
    '## Summary',
    idea.summary || 'No summary provided.',
    '',
    '## Why Now',
    idea.whyNow || 'No timing note provided.',
    '',
    '## MVP Scope',
    idea.mvpScope || analysis?.mvpSuggestion || 'No MVP scope provided.',
    '',
    '## First Action',
    idea.firstAction || analysis?.firstActions?.[0] || 'Define the first concrete action.',
    '',
    '## Tags',
    idea.tags.length > 0 ? idea.tags.map((tag) => `- ${tag}`).join('\n') : '- seed',
  ]

  if (analysis) {
    lines.push('', '## AI Analysis', analysis.mvpSuggestion, '', '### Risks', ...analysis.risks.map((risk) => `- ${risk}`))
    lines.push('', '### First Actions', ...analysis.firstActions.map((action) => `- ${action}`))
    lines.push('', '### Boundary Notes', analysis.boundaryNotes)
  }

  if (idea.scratchpad) {
    lines.push('', '## Scratchpad', idea.scratchpad)
  }

  return `${lines.join('\n')}\n`
}

const getStoredLlmApiKey = () => {
  const saved = getSetting('llmApiKey')
  return typeof saved === 'string' && saved.length > 0 ? saved : process.env.LLM_API_KEY ?? ''
}

const maskSecret = (value: string) => (value.length > 0 ? `••••${value.slice(-4)}` : '')

const getSettings = () => {
  const settings = Object.fromEntries(
    Object.entries(settingsDefaults).map(([key, defaultValue]) => {
      const saved = getSetting(key)
      return [key, saved ?? defaultValue]
    }),
  )
  const llmApiKey = getStoredLlmApiKey()
  return {
    ...settings,
    schemaVersion: settingsSchemaVersion,
    storagePath: settings.storagePath ?? filesDir(),
    llmApiKeyConfigured: llmApiKey.length > 0,
    llmApiKeyMasked: maskSecret(llmApiKey),
  }
}

const handleSettingsUpdate: RequestHandler = (request, response) => {
  const body = request.body as Record<string, unknown>
  for (const key of editableSettings) {
    if (typeof body[key] === 'string') {
      setSetting(key, body[key])
    }
  }
  if (typeof body.llmApiKey === 'string') {
    setSetting('llmApiKey', body.llmApiKey)
  }
  response.json({ settings: getSettings() })
}

const buildBackupManifest = () => {
  const ideas = listIdeas()
  return {
    schemaVersion: 1,
    product: 'Personal Idea Workbench',
    exportedAt: new Date().toISOString(),
    settings: getSettings(),
    ideas,
    ideaEvents: ideas.flatMap((idea) => listIdeaEvents(idea.id)),
    aiCompletions: ideas.flatMap((idea) => listAiCompletions(idea.id)),
    files: listFiles(),
  }
}

const createBackupExport = () => {
  const manifest = buildBackupManifest()
  const filename = `personal-idea-workbench-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
  const storageKey = `exports/${Date.now().toString(36)}-${filename}`
  const stored = writeStoredFile(storageKey, JSON.stringify(manifest, null, 2))
  const file = createFileMetadata({
    kind: 'export',
    filename,
    mimeType: 'application/json',
    sizeBytes: stored.sizeBytes,
    storageKey,
    sha256: stored.sha256,
  })
  return { file, manifest }
}

const createContentFileHandler: RequestHandler = (request, response) => {
  const idea = getIdea(routeParam(request.params.id))
  if (!idea) {
    response.status(404).json({ error: 'Idea not found' })
    return
  }

  const body = request.body as { filename?: unknown; kind?: unknown; mimeType?: unknown; content?: unknown }
  if (typeof body.filename !== 'string' || typeof body.kind !== 'string' || typeof body.content !== 'string') {
    response.status(400).json({ error: 'filename, kind, and content are required' })
    return
  }
  if (!isSafeFilename(body.filename)) {
    response.status(400).json({ error: 'Unsafe filename' })
    return
  }

  const storageKey = `${slugify(idea.id)}/${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}-${body.filename}`
  const stored = writeStoredFile(storageKey, body.content)
  const file = createFileMetadata({
    ideaId: idea.id,
    kind: body.kind,
    filename: body.filename,
    mimeType: typeof body.mimeType === 'string' ? body.mimeType : 'application/octet-stream',
    sizeBytes: stored.sizeBytes,
    storageKey,
    sha256: stored.sha256,
  })
  response.status(201).json({ file })
}

const downloadFileHandler: RequestHandler = (request, response) => {
  const file = getFile(routeParam(request.params.id))
  if (!file) {
    response.status(404).json({ error: 'File not found' })
    return
  }

  try {
    const content = readStoredFile(file.storageKey)
    response.setHeader('Content-Type', file.mimeType ?? 'application/octet-stream')
    response.send(content)
  } catch {
    response.status(404).json({ error: 'File content not found' })
  }
}

const deleteFileHandler: RequestHandler = (request, response) => {
  const file = getFile(routeParam(request.params.id))
  if (!file) {
    response.status(404).json({ error: 'File not found' })
    return
  }

  deleteStoredFile(file.storageKey)
  deleteFileMetadata(file.id)
  response.json({ ok: true })
}

export const createApp = () => {
  assertAuthConfiguration()

  const app = express()
  const distDir = resolve('dist')

  app.use(express.json({ limit: '1mb' }))

  app.get('/api/health', (_request, response) => {
    response.json({ ok: true })
  })

  app.get('/api/auth/session', session)
  app.post('/api/auth/login', login)
  app.post('/api/auth/logout', logout)

  const agentRouter = express.Router()
  agentRouter.use(requireAgentToken)

  agentRouter.get('/context', (_request, response) => {
    response.json({
      protocol: { name: 'personal-idea-workbench-agent', version: 1 },
      workspace: { name: 'Personal Idea Workbench', model: 'Local-first Kanban + Spatial Detail View + AI Augmentation' },
      api: { version: 'v1', basePath: '/api/agent/v1', settingsSchemaVersion },
      auth: { agent: 'bearer', web: 'session-cookie', settingsWritable: false },
      rules: { localFirst: true, singleUser: true, selectedIdeaOnlyAi: true, aiMaySelectIdea: false },
      ai: { completionScope: 'selected-idea', requiresIdeaId: true, autoSelectIdea: false },
      capabilities: ['ideas', 'events', 'completion', 'agent_pack', 'files'],
      routes: [
        { method: 'GET', path: '/context', auth: 'bearer' },
        { method: 'GET', path: '/schema', auth: 'bearer' },
        { method: 'GET', path: '/settings', auth: 'bearer', writable: false },
        { method: 'GET', path: '/ideas', auth: 'bearer' },
        { method: 'POST', path: '/ideas', auth: 'bearer' },
        { method: 'GET', path: '/ideas/:id', auth: 'bearer' },
        { method: 'PATCH', path: '/ideas/:id', auth: 'bearer' },
        { method: 'DELETE', path: '/ideas/:id', auth: 'bearer' },
        { method: 'POST', path: '/ideas/:id/complete', auth: 'bearer', scope: 'selected-idea-ai' },
        { method: 'POST', path: '/ideas/:id/agent-pack', auth: 'bearer' },
        { method: 'GET', path: '/ideas/:id/files', auth: 'bearer' },
        { method: 'POST', path: '/ideas/:id/files/content', auth: 'bearer' },
      ],
    })
  })

  agentRouter.get('/schema', (_request, response) => {
    response.json({ ideaStatuses, ideaSources, fileKinds })
  })

  agentRouter.get('/settings', (_request, response) => {
    response.json({ settings: getSettings(), writable: false })
  })

  agentRouter.get('/ideas', (_request, response) => {
    response.json({ ideas: listIdeas() })
  })

  agentRouter.get('/ideas/:id', (request, response) => {
    const idea = getIdea(request.params.id)
    if (!idea) {
      response.status(404).json({ error: 'Idea not found' })
      return
    }
    response.json({ idea })
  })

  agentRouter.post('/ideas', (request, response) => {
    const idea = upsertIdea(buildIdea(request.body as Partial<IdeaRecord>, 'agent'))
    if (!idea) {
      response.status(500).json({ error: 'Idea could not be saved' })
      return
    }
    recordIdeaEvent({ ideaId: idea.id, type: 'created', actor: 'agent', payload: { endpoint: '/api/agent/v1/ideas' } })
    response.status(201).json({ idea })
  })

  agentRouter.patch('/ideas/:id', (request, response) => {
    const idea = patchIdea(request.params.id, request.body as Partial<IdeaRecord>)
    if (!idea) {
      response.status(404).json({ error: 'Idea not found' })
      return
    }
    recordIdeaEvent({ ideaId: idea.id, type: 'updated', actor: 'agent', payload: request.body })
    response.json({ idea })
  })

  agentRouter.delete('/ideas/:id', (request, response) => {
    response.json({ ok: deleteIdea(request.params.id) })
  })

  agentRouter.get('/ideas/:id/events', (request, response) => {
    if (!getIdea(request.params.id)) {
      response.status(404).json({ error: 'Idea not found' })
      return
    }
    response.json({ events: listIdeaEvents(request.params.id) })
  })

  agentRouter.post('/ideas/:id/events', (request, response) => {
    if (!getIdea(request.params.id)) {
      response.status(404).json({ error: 'Idea not found' })
      return
    }
    const body = request.body as { type?: string; payload?: unknown }
    const event = recordIdeaEvent({ ideaId: request.params.id, type: body.type ?? 'agent_event', actor: 'agent', payload: body.payload })
    response.status(201).json({ event })
  })

  agentRouter.post('/ideas/:id/complete', async (request, response) => {
    const idea = getIdea(request.params.id)
    if (!idea) {
      response.status(404).json({ error: 'Idea not found' })
      return
    }

    const result = await completeAndPersistIdea(idea, (request.body as { notes?: string } | undefined)?.notes)
    response.json(result)
  })

  agentRouter.post('/ideas/:id/agent-pack', (request, response) => {
    const idea = getIdea(request.params.id)
    if (!idea) {
      response.status(404).json({ error: 'Idea not found' })
      return
    }

    const filename = `${slugify(idea.title)}-agent-pack.md`
    const storageKey = `${idea.id}/${Date.now().toString(36)}-${filename}`
    const stored = writeStoredFile(storageKey, buildAgentPackMarkdown(idea))
    const file = createFileMetadata({
      ideaId: idea.id,
      kind: 'agent_pack',
      filename,
      mimeType: 'text/markdown',
      sizeBytes: stored.sizeBytes,
      storageKey,
      sha256: stored.sha256,
    })
    recordIdeaEvent({ ideaId: idea.id, type: 'agent_pack_generated', actor: 'agent', payload: { fileId: file.id, storageKey } })
    response.status(201).json({ file })
  })

  agentRouter.get('/ideas/:id/files', (request, response) => {
    if (!getIdea(request.params.id)) {
      response.status(404).json({ error: 'Idea not found' })
      return
    }
    response.json({ files: listFiles(request.params.id) })
  })

  agentRouter.post('/ideas/:id/files', (request, response) => {
    if (!getIdea(request.params.id)) {
      response.status(404).json({ error: 'Idea not found' })
      return
    }
    const body = request.body as { kind?: string; filename?: string; mimeType?: string; sizeBytes?: number; storageKey?: string; sha256?: string }
    if (!body.kind || !body.filename || !body.storageKey) {
      response.status(400).json({ error: 'kind, filename, and storageKey are required' })
      return
    }
    if (!isSafeFilename(body.filename)) {
      response.status(400).json({ error: 'Unsafe filename' })
      return
    }
    const file = createFileMetadata({
      ideaId: request.params.id,
      kind: body.kind,
      filename: body.filename,
      mimeType: body.mimeType,
      sizeBytes: body.sizeBytes,
      storageKey: body.storageKey,
      sha256: body.sha256,
    })
    response.status(201).json({ file })
  })

  agentRouter.post('/ideas/:id/files/content', createContentFileHandler)
  agentRouter.get('/files/:id/download', downloadFileHandler)
  agentRouter.delete('/files/:id', deleteFileHandler)

  agentRouter.post('/complete', (_request, response) => {
    response.status(404).json({ error: 'Use /api/agent/v1/ideas/:id/complete with an explicit idea id.' })
  })

  app.use('/api/agent/v1', agentRouter)

  app.use('/api', requireSessionOrToken)

  app.get('/api/settings', requireSession, (_request, response) => {
    response.json({ settings: getSettings() })
  })
  app.put('/api/settings', requireSession, handleSettingsUpdate)
  app.post('/api/settings/backup', requireSession, (_request, response) => {
    response.status(201).json(createBackupExport())
  })

  app.get('/api/ideas', (_request, response) => {
    response.json({ ideas: listIdeas() })
  })

  app.post('/api/ideas', (request, response) => {
    const body = request.body as Partial<IdeaRecord>
    const idea = buildIdea(body, body.source ?? 'local')
    response.status(201).json({ idea: upsertIdea(idea) })
  })

  app.patch('/api/ideas/:id', (request, response) => {
    const idea = patchIdea(request.params.id, request.body as Partial<IdeaRecord>)
    if (!idea) {
      response.status(404).json({ error: 'Idea not found' })
      return
    }
    response.json({ idea })
  })

  app.delete('/api/ideas/:id', (request, response) => {
    response.json({ ok: deleteIdea(request.params.id) })
  })

  app.post('/api/ideas/:id/complete', async (request, response) => {
    const requestIdea = (request.body as { idea?: IdeaRecord }).idea
    const idea = getIdea(request.params.id) ?? requestIdea
    if (!idea) {
      response.status(404).json({ error: 'Idea not found' })
      return
    }

    const result = await completeAndPersistIdea(idea, (request.body as { notes?: string } | undefined)?.notes)
    response.json(result)
  })

  app.post('/api/ideas/:id/files/content', createContentFileHandler)
  app.get('/api/ideas/:id/files', (request, response) => {
    const ideaId = routeParam(request.params.id)
    if (!getIdea(ideaId)) {
      response.status(404).json({ error: 'Idea not found' })
      return
    }
    response.json({ files: listFiles(ideaId) })
  })
  app.get('/api/files/:id/download', downloadFileHandler)
  app.delete('/api/files/:id', deleteFileHandler)

  if (existsSync(distDir)) {
    app.use(express.static(distDir))
    app.use((_request, response) => {
      response.sendFile(join(distDir, 'index.html'))
    })
  }

  return app
}

if (process.env.NODE_ENV !== 'test') {
  createApp().listen(port, () => {
    console.log(`Personal Idea Workbench listening on :${port}`)
  })
}
