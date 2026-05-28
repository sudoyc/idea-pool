export type IdeaStatus = 'INBOX' | 'PIPELINE' | 'TRASH'

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
  tags: string[]
  whyNow: string
  scratchpad: string
  aiEnriched: boolean
  aiAnalysis?: AiAnalysis
  createdAt: string
  updatedAt: string
}
