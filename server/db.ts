import Database from 'better-sqlite3'
import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import type { AiAnalysis, IdeaRecord, IdeaStatus } from './types.js'

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
    tags_json TEXT NOT NULL DEFAULT '[]',
    why_now TEXT NOT NULL DEFAULT '',
    scratchpad TEXT NOT NULL DEFAULT '',
    ai_enriched INTEGER NOT NULL DEFAULT 0,
    ai_analysis_json TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`)

type IdeaRow = {
  id: string
  title: string
  summary: string
  status: IdeaStatus
  tags_json: string
  why_now: string
  scratchpad: string
  ai_enriched: number
  ai_analysis_json: string | null
  created_at: string
  updated_at: string
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
  tags: parseJson<string[]>(row.tags_json, []),
  whyNow: row.why_now,
  scratchpad: row.scratchpad,
  aiEnriched: row.ai_enriched === 1,
  aiAnalysis: parseJson<AiAnalysis | undefined>(row.ai_analysis_json, undefined),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
})

export const listIdeas = () =>
  db.prepare('SELECT * FROM ideas ORDER BY updated_at DESC').all().map((row) => rowToIdea(row as IdeaRow))

export const getIdea = (id: string) => {
  const row = db.prepare('SELECT * FROM ideas WHERE id = ?').get(id) as IdeaRow | undefined
  return row ? rowToIdea(row) : null
}

export const upsertIdea = (idea: IdeaRecord) => {
  db.prepare(`
    INSERT INTO ideas (id, title, summary, status, tags_json, why_now, scratchpad, ai_enriched, ai_analysis_json, created_at, updated_at)
    VALUES (@id, @title, @summary, @status, @tagsJson, @whyNow, @scratchpad, @aiEnriched, @aiAnalysisJson, @createdAt, @updatedAt)
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title,
      summary = excluded.summary,
      status = excluded.status,
      tags_json = excluded.tags_json,
      why_now = excluded.why_now,
      scratchpad = excluded.scratchpad,
      ai_enriched = excluded.ai_enriched,
      ai_analysis_json = excluded.ai_analysis_json,
      updated_at = excluded.updated_at
  `).run({
    id: idea.id,
    title: idea.title,
    summary: idea.summary,
    status: idea.status,
    tagsJson: JSON.stringify(idea.tags),
    whyNow: idea.whyNow,
    scratchpad: idea.scratchpad,
    aiEnriched: idea.aiEnriched ? 1 : 0,
    aiAnalysisJson: idea.aiAnalysis ? JSON.stringify(idea.aiAnalysis) : null,
    createdAt: idea.createdAt,
    updatedAt: idea.updatedAt,
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
