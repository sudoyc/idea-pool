import Database from 'better-sqlite3'
import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import type { AiAnalysis, AiCompletionRecord, FileRecord, IdeaEventRecord, IdeaRecord, IdeaSource, IdeaStatus } from './types.js'

const databaseUrl = process.env.DATABASE_URL ?? './data/idea-pool.db'
const dbPath = databaseUrl.startsWith('file:') ? databaseUrl.slice(5) : databaseUrl
const resolvedPath = resolve(dbPath)

mkdirSync(dirname(resolvedPath), { recursive: true })

export const db = new Database(resolvedPath)

type WorkbenchDatabase = Database.Database

const nowIso = () => new Date().toISOString()
const createId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`

const parseJson = <T>(value: string | null, fallback: T): T => {
  if (!value) return fallback
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

const stringifyJson = (value: unknown) => JSON.stringify(value ?? null)

const ensureColumn = (database: WorkbenchDatabase, table: string, name: string, definition: string) => {
  const columns = database.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>
  if (columns.some((column) => column.name === name)) return
  database.exec(`ALTER TABLE ${table} ADD COLUMN ${name} ${definition}`)
}

export const ensureSchema = (database: WorkbenchDatabase) => {
  database.pragma('journal_mode = WAL')

  database.exec(`
    CREATE TABLE IF NOT EXISTS ideas (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      summary TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'INBOX',
      source TEXT NOT NULL DEFAULT 'local',
      tags_json TEXT NOT NULL DEFAULT '[]',
      why_now TEXT NOT NULL DEFAULT '',
      mvp_scope TEXT,
      first_action TEXT,
      scratchpad TEXT NOT NULL DEFAULT '',
      ai_enriched INTEGER NOT NULL DEFAULT 0,
      ai_analysis_json TEXT,
      sort_order REAL NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      archived_at TEXT
    );

    CREATE TABLE IF NOT EXISTS idea_events (
      id TEXT PRIMARY KEY,
      idea_id TEXT NOT NULL,
      type TEXT NOT NULL,
      actor TEXT NOT NULL,
      payload_json TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (idea_id) REFERENCES ideas(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS ai_completions (
      id TEXT PRIMARY KEY,
      idea_id TEXT NOT NULL,
      provider TEXT,
      model TEXT,
      prompt_hash TEXT,
      input_json TEXT NOT NULL,
      output_json TEXT NOT NULL,
      status TEXT NOT NULL,
      error TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (idea_id) REFERENCES ideas(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS files (
      id TEXT PRIMARY KEY,
      idea_id TEXT,
      kind TEXT NOT NULL,
      filename TEXT NOT NULL,
      mime_type TEXT,
      size_bytes INTEGER,
      storage_key TEXT NOT NULL,
      sha256 TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (idea_id) REFERENCES ideas(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_ideas_status_sort ON ideas(status, sort_order, updated_at);
    CREATE INDEX IF NOT EXISTS idx_idea_events_idea_created ON idea_events(idea_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_ai_completions_idea_created ON ai_completions(idea_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_files_idea_created ON files(idea_id, created_at);
  `)

  ensureColumn(database, 'ideas', 'source', "TEXT NOT NULL DEFAULT 'local'")
  ensureColumn(database, 'ideas', 'mvp_scope', 'TEXT')
  ensureColumn(database, 'ideas', 'first_action', 'TEXT')
  ensureColumn(database, 'ideas', 'sort_order', 'REAL NOT NULL DEFAULT 0')
  ensureColumn(database, 'ideas', 'archived_at', 'TEXT')
}

type IdeaRow = {
  id: string
  title: string
  summary: string
  status: IdeaStatus
  source: IdeaSource
  tags_json: string
  why_now: string
  mvp_scope: string | null
  first_action: string | null
  scratchpad: string
  ai_enriched: number
  ai_analysis_json: string | null
  sort_order: number
  created_at: string
  updated_at: string
  archived_at: string | null
}

type IdeaEventRow = {
  id: string
  idea_id: string
  type: string
  actor: string
  payload_json: string | null
  created_at: string
}

type AiCompletionRow = {
  id: string
  idea_id: string
  provider: string | null
  model: string | null
  prompt_hash: string | null
  input_json: string
  output_json: string
  status: string
  error: string | null
  created_at: string
}

type FileRow = {
  id: string
  idea_id: string | null
  kind: string
  filename: string
  mime_type: string | null
  size_bytes: number | null
  storage_key: string
  sha256: string | null
  created_at: string
}

export const rowToIdea = (row: IdeaRow): IdeaRecord => ({
  id: row.id,
  title: row.title,
  summary: row.summary,
  status: row.status,
  source: row.source,
  tags: parseJson<string[]>(row.tags_json, []),
  whyNow: row.why_now,
  mvpScope: row.mvp_scope ?? undefined,
  firstAction: row.first_action ?? undefined,
  scratchpad: row.scratchpad,
  aiEnriched: row.ai_enriched === 1,
  aiAnalysis: parseJson<AiAnalysis | undefined>(row.ai_analysis_json, undefined),
  sortOrder: row.sort_order,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  archivedAt: row.archived_at,
})

const rowToIdeaEvent = (row: IdeaEventRow): IdeaEventRecord => ({
  id: row.id,
  ideaId: row.idea_id,
  type: row.type,
  actor: row.actor,
  payload: parseJson<unknown>(row.payload_json, undefined),
  createdAt: row.created_at,
})

const rowToAiCompletion = (row: AiCompletionRow): AiCompletionRecord => ({
  id: row.id,
  ideaId: row.idea_id,
  provider: row.provider,
  model: row.model,
  promptHash: row.prompt_hash,
  input: parseJson<unknown>(row.input_json, null),
  output: parseJson<unknown>(row.output_json, null),
  status: row.status,
  error: row.error,
  createdAt: row.created_at,
})

const rowToFile = (row: FileRow): FileRecord => ({
  id: row.id,
  ideaId: row.idea_id,
  kind: row.kind,
  filename: row.filename,
  mimeType: row.mime_type,
  sizeBytes: row.size_bytes,
  storageKey: row.storage_key,
  sha256: row.sha256,
  createdAt: row.created_at,
})

export const createWorkbenchRepository = (database: WorkbenchDatabase) => {
  const repository = {
  listIdeas: () =>
    database.prepare('SELECT * FROM ideas ORDER BY status ASC, sort_order ASC, updated_at DESC').all().map((row) => rowToIdea(row as IdeaRow)),

  getIdea: (id: string) => {
    const row = database.prepare('SELECT * FROM ideas WHERE id = ?').get(id) as IdeaRow | undefined
    return row ? rowToIdea(row) : null
  },

  upsertIdea: (idea: IdeaRecord) => {
    database
      .prepare(
        `
        INSERT INTO ideas (id, title, summary, status, source, tags_json, why_now, mvp_scope, first_action, scratchpad, ai_enriched, ai_analysis_json, sort_order, created_at, updated_at, archived_at)
        VALUES (@id, @title, @summary, @status, @source, @tagsJson, @whyNow, @mvpScope, @firstAction, @scratchpad, @aiEnriched, @aiAnalysisJson, @sortOrder, @createdAt, @updatedAt, @archivedAt)
        ON CONFLICT(id) DO UPDATE SET
          title = excluded.title,
          summary = excluded.summary,
          status = excluded.status,
          source = excluded.source,
          tags_json = excluded.tags_json,
          why_now = excluded.why_now,
          mvp_scope = excluded.mvp_scope,
          first_action = excluded.first_action,
          scratchpad = excluded.scratchpad,
          ai_enriched = excluded.ai_enriched,
          ai_analysis_json = excluded.ai_analysis_json,
          sort_order = excluded.sort_order,
          archived_at = excluded.archived_at,
          updated_at = excluded.updated_at
      `,
      )
      .run({
        id: idea.id,
        title: idea.title,
        summary: idea.summary,
        status: idea.status,
        source: idea.source,
        tagsJson: JSON.stringify(idea.tags),
        whyNow: idea.whyNow,
        mvpScope: idea.mvpScope ?? null,
        firstAction: idea.firstAction ?? null,
        scratchpad: idea.scratchpad,
        aiEnriched: idea.aiEnriched ? 1 : 0,
        aiAnalysisJson: idea.aiAnalysis ? JSON.stringify(idea.aiAnalysis) : null,
        sortOrder: idea.sortOrder,
        createdAt: idea.createdAt,
        updatedAt: idea.updatedAt,
        archivedAt: idea.archivedAt ?? null,
      })
    return repository.getIdea(idea.id)
  },

  patchIdea: (id: string, patch: Partial<IdeaRecord>) => {
    const current = repository.getIdea(id)
    if (!current) return null
    return repository.upsertIdea({ ...current, ...patch, updatedAt: nowIso() })
  },

  deleteIdea: (id: string) => {
    const result = database.prepare('DELETE FROM ideas WHERE id = ?').run(id)
    return result.changes > 0
  },

  recordIdeaEvent: (input: { ideaId: string; type: string; actor: string; payload?: unknown; id?: string; createdAt?: string }) => {
    const event: IdeaEventRecord = {
      id: input.id ?? createId('event'),
      ideaId: input.ideaId,
      type: input.type,
      actor: input.actor,
      payload: input.payload,
      createdAt: input.createdAt ?? nowIso(),
    }
    database
      .prepare(
        'INSERT INTO idea_events (id, idea_id, type, actor, payload_json, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      )
      .run(event.id, event.ideaId, event.type, event.actor, stringifyJson(event.payload), event.createdAt)
    return event
  },

  listIdeaEvents: (ideaId: string) =>
    database
      .prepare('SELECT * FROM idea_events WHERE idea_id = ? ORDER BY created_at ASC')
      .all(ideaId)
      .map((row) => rowToIdeaEvent(row as IdeaEventRow)),

  recordAiCompletion: (input: {
    ideaId: string
    provider?: string | null
    model?: string | null
    promptHash?: string | null
    input: unknown
    output: unknown
    status: string
    error?: string | null
    id?: string
    createdAt?: string
  }) => {
    const completion: AiCompletionRecord = {
      id: input.id ?? createId('completion'),
      ideaId: input.ideaId,
      provider: input.provider ?? null,
      model: input.model ?? null,
      promptHash: input.promptHash ?? null,
      input: input.input,
      output: input.output,
      status: input.status,
      error: input.error ?? null,
      createdAt: input.createdAt ?? nowIso(),
    }
    database
      .prepare(
        `INSERT INTO ai_completions (id, idea_id, provider, model, prompt_hash, input_json, output_json, status, error, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        completion.id,
        completion.ideaId,
        completion.provider,
        completion.model,
        completion.promptHash,
        stringifyJson(completion.input),
        stringifyJson(completion.output),
        completion.status,
        completion.error,
        completion.createdAt,
      )
    return completion
  },

  listAiCompletions: (ideaId: string) =>
    database
      .prepare('SELECT * FROM ai_completions WHERE idea_id = ? ORDER BY created_at DESC')
      .all(ideaId)
      .map((row) => rowToAiCompletion(row as AiCompletionRow)),

  createFileMetadata: (input: {
    ideaId?: string | null
    kind: string
    filename: string
    mimeType?: string | null
    sizeBytes?: number | null
    storageKey: string
    sha256?: string | null
    id?: string
    createdAt?: string
  }) => {
    const file: FileRecord = {
      id: input.id ?? createId('file'),
      ideaId: input.ideaId ?? null,
      kind: input.kind,
      filename: input.filename,
      mimeType: input.mimeType ?? null,
      sizeBytes: input.sizeBytes ?? null,
      storageKey: input.storageKey,
      sha256: input.sha256 ?? null,
      createdAt: input.createdAt ?? nowIso(),
    }
    database
      .prepare(
        'INSERT INTO files (id, idea_id, kind, filename, mime_type, size_bytes, storage_key, sha256, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      )
      .run(file.id, file.ideaId, file.kind, file.filename, file.mimeType, file.sizeBytes, file.storageKey, file.sha256, file.createdAt)
    return file
  },

  getFile: (id: string) => {
    const row = database.prepare('SELECT * FROM files WHERE id = ?').get(id) as FileRow | undefined
    return row ? rowToFile(row) : null
  },

  listFiles: (ideaId?: string) => {
    const rows = ideaId
      ? database.prepare('SELECT * FROM files WHERE idea_id = ? ORDER BY created_at DESC').all(ideaId)
      : database.prepare('SELECT * FROM files ORDER BY created_at DESC').all()
    return rows.map((row) => rowToFile(row as FileRow))
  },

  deleteFileMetadata: (id: string) => {
    const result = database.prepare('DELETE FROM files WHERE id = ?').run(id)
    return result.changes > 0
  },

  setSetting: (key: string, value: unknown) => {
    database
      .prepare(
        `INSERT INTO settings (key, value_json, updated_at) VALUES (?, ?, ?)
         ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json, updated_at = excluded.updated_at`,
      )
      .run(key, stringifyJson(value), nowIso())
  },

  getSetting: (key: string) => {
    const row = database.prepare('SELECT value_json FROM settings WHERE key = ?').get(key) as { value_json: string } | undefined
    return row ? parseJson<unknown>(row.value_json, null) : null
  },
  }
  return repository
}

ensureSchema(db)

export const repository = createWorkbenchRepository(db)

export const listIdeas = repository.listIdeas
export const getIdea = repository.getIdea
export const upsertIdea = repository.upsertIdea
export const patchIdea = repository.patchIdea
export const deleteIdea = repository.deleteIdea
export const recordIdeaEvent = repository.recordIdeaEvent
export const listIdeaEvents = repository.listIdeaEvents
export const recordAiCompletion = repository.recordAiCompletion
export const listAiCompletions = repository.listAiCompletions
export const createFileMetadata = repository.createFileMetadata
export const getFile = repository.getFile
export const listFiles = repository.listFiles
export const deleteFileMetadata = repository.deleteFileMetadata
export const setSetting = repository.setSetting
export const getSetting = repository.getSetting
