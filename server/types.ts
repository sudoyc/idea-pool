export type IdeaStatus = 'INBOX' | 'PIPELINE' | 'TRASH'

export type IdeaSource = 'local' | 'agent' | 'import' | 'llm'

export type AiAnalysis = {
  mvpSuggestion: string
  risks: string[]
  firstActions: string[]
  boundaryNotes: string
}

export type IdeaRecord = {
  id: string
  title: string
  summary: string
  status: IdeaStatus
  source: IdeaSource
  tags: string[]
  whyNow: string
  mvpScope?: string
  firstAction?: string
  scratchpad: string
  aiEnriched: boolean
  aiAnalysis?: AiAnalysis
  sortOrder: number
  createdAt: string
  updatedAt: string
  archivedAt?: string | null
}

export type IdeaEventRecord = {
  id: string
  ideaId: string
  type: string
  actor: 'user' | 'agent' | 'system' | 'llm' | string
  payload?: unknown
  createdAt: string
}

export type AiCompletionRecord = {
  id: string
  ideaId: string
  provider?: string | null
  model?: string | null
  promptHash?: string | null
  input: unknown
  output: unknown
  status: 'succeeded' | 'failed' | string
  error?: string | null
  createdAt: string
}

export type FileRecord = {
  id: string
  ideaId?: string | null
  kind: 'attachment' | 'export' | 'agent_pack' | 'markdown' | 'image' | string
  filename: string
  mimeType?: string | null
  sizeBytes?: number | null
  storageKey: string
  sha256?: string | null
  createdAt: string
}

export type AuthMode = 'disabled' | 'password' | 'token'
