import 'dotenv/config'
import express from 'express'
import { existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { assertAuthConfiguration, login, logout, requireSessionOrToken, session } from './auth.js'
import { deleteIdea, getIdea, listIdeas, patchIdea, upsertIdea } from './db.js'
import { completeIdea } from './llm.js'
import type { IdeaRecord } from './types.js'

assertAuthConfiguration()

const app = express()
const port = Number(process.env.PORT ?? 3000)
const distDir = resolve('dist')

app.use(express.json({ limit: '1mb' }))

app.get('/api/health', (_request, response) => {
  response.json({ ok: true })
})

app.get('/api/auth/session', session)
app.post('/api/auth/login', login)
app.post('/api/auth/logout', logout)

app.use('/api', requireSessionOrToken)

app.get('/api/ideas', (_request, response) => {
  response.json({ ideas: listIdeas() })
})

app.post('/api/ideas', (request, response) => {
  const now = new Date().toISOString()
  const body = request.body as Partial<IdeaRecord>
  const idea: IdeaRecord = {
    id: body.id ?? `idea-${Date.now().toString(36)}`,
    title: body.title ?? 'Untitled Seed',
    summary: body.summary ?? '',
    status: body.status ?? 'INBOX',
    source: body.source ?? 'local',
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
  }
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

  const aiAnalysis = await completeIdea(idea, (request.body as { notes?: string }).notes)
  const updated = patchIdea(idea.id, { aiAnalysis, aiEnriched: true, status: 'PIPELINE' }) ?? { ...idea, aiAnalysis, aiEnriched: true }
  response.json({ idea: updated, aiAnalysis })
})

if (existsSync(distDir)) {
  app.use(express.static(distDir))
  app.use((_request, response) => {
    response.sendFile(join(distDir, 'index.html'))
  })
}

app.listen(port, () => {
  console.log(`Personal Idea Workbench listening on :${port}`)
})
