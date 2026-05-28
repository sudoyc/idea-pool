export type TimeBudget = '30m' | '2h' | 'tonight' | 'weekend'

export type IdeaCategory =
  | 'agent-workflow'
  | 'personal-productivity'
  | 'infra-tooling'
  | 'visual-frontend'
  | 'content-creation'
  | 'game-toy'

export type IdeaScore = {
  selfUse: number
  feedbackSpeed: number
  scopeClarity: number
  extensibility: number
}

export type ProjectIdea = {
  id: string
  title: string
  category: IdeaCategory
  priority?: 'P0' | 'P1' | 'P2'
  summary: string
  whyNow: string
  mvp: string
  firstStep: string
  techStack: string[]
  expansion: string[]
  keywords: string[]
  budgetFit: TimeBudget[]
  baseScore: IdeaScore
}

export type IdeaRequest = {
  context: string
  timeBudget: TimeBudget
  techStack: string
  constraints: string
  count: number
}

export type GeneratedIdea = ProjectIdea & {
  rankScore: number
  matchedTerms: string[]
}
