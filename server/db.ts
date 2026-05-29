import Database from 'better-sqlite3'
import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import type { AiAnalysis, IdeaRecord, IdeaSource, IdeaStatus } from './types.js'

const databaseUrl = process.env.DATABASE_URL ?? './data/idea-pool.db'
const dbPath = databaseUrl.startsWith('file:') ? databaseUrl.slice(5) : databaseUrl
const resolvedPath = resolve(dbPath)

mkdirSync(dirname(resolvedPath), { recursive: true })

export const db = new Database(resolvedPath)

db.pragma('journal_mode = WAL')

db.exec(`
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
`)

const ensureColumn = (name: string, definition: string) => {
  const columns = db.prepare('PRAGMA table_info(ideas)').all() as Array<{ name: string }>
  if (columns.some((column) => column.name === name)) return
  db.exec(`ALTER TABLE ideas ADD COLUMN ${name} ${definition}`)
}

ensureColumn('source', "TEXT NOT NULL DEFAULT 'local'")
ensureColumn('mvp_scope', 'TEXT')
ensureColumn('first_action', 'TEXT')
ensureColumn('sort_order', 'REAL NOT NULL DEFAULT 0')
ensureColumn('archived_at', 'TEXT')

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

const parseJson = <T>(value: string | null, fallback: T): T => {
  if (!value) return fallback
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
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

export const listIdeas = () =>
  db.prepare('SELECT * FROM ideas ORDER BY status ASC, sort_order ASC, updated_at DESC').all().map((row) => rowToIdea(row as IdeaRow))

export const getIdea = (id: string) => {
  const row = db.prepare('SELECT * FROM ideas WHERE id = ?').get(id) as IdeaRow | undefined
  return row ? rowToIdea(row) : null
}

export const upsertIdea = (idea: IdeaRecord) => {
  db.prepare(`
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
  `).run({
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
  return getIdea(idea.id)
}

export const patchIdea = (id: string, patch: Partial<IdeaRecord>) => {
  const current = getIdea(id)
  if (!current) return null
  return upsertIdea({ ...current, ...patch, updatedAt: new Date().toISOString() })
}

export const deleteIdea = (id: string) => {
  const result = db.prepare('DELETE FROM ideas WHERE id = ?').run(id)
  return result.changes > 0
}
