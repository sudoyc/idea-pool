import { seedIdeas } from './data/seedIdeas'
import type { GeneratedIdea, IdeaRequest, IdeaScore, ProjectIdea } from './types'

const priorityBoost = {
  P0: 18,
  P1: 9,
  P2: 3,
} as const

const normalize = (value: string) => value.trim().toLowerCase()

const splitTerms = (value: string) =>
  normalize(value)
    .split(/[\s,，;；/、|｜+]+/)
    .map((term) => term.trim())
    .filter((term) => term.length >= 2)

const scoreSum = (score: IdeaScore) =>
  score.selfUse + score.feedbackSpeed + score.scopeClarity + score.extensibility

const ideaText = (idea: ProjectIdea) =>
  normalize(
    [
      idea.title,
      idea.summary,
      idea.whyNow,
      idea.mvp,
      idea.firstStep,
      idea.techStack.join(' '),
      idea.keywords.join(' '),
      idea.expansion.join(' '),
    ].join(' '),
  )

const matchedKeywords = (idea: ProjectIdea, source: string) =>
  idea.keywords.filter((keyword) => source.includes(normalize(keyword)))

const matchedInputTerms = (idea: ProjectIdea, terms: string[]) => {
  const text = ideaText(idea)
  return terms.filter((term) => text.includes(term))
}

const unique = (items: string[]) => Array.from(new Set(items))

const categoryConstraintBoost = (idea: ProjectIdea, source: string) => {
  if (source.includes('不要后端') && idea.techStack.some((item) => normalize(item).includes('localstorage'))) {
    return 4
  }
  if (source.includes('本地') && idea.keywords.some((keyword) => keyword.includes('本地') || keyword.includes('local'))) {
    return 5
  }
  if (source.includes('前端') && idea.category === 'visual-frontend') {
    return 5
  }
  if (source.includes('agent') && idea.category === 'agent-workflow') {
    return 5
  }
  return 0
}

export const totalScore = (score: IdeaScore) => scoreSum(score)

export const generateIdeas = (request: IdeaRequest): GeneratedIdea[] => {
  const source = normalize([request.context, request.techStack, request.constraints].join(' '))
  const terms = unique([
    ...splitTerms(request.context),
    ...splitTerms(request.techStack),
    ...splitTerms(request.constraints),
  ])

  return seedIdeas
    .map((idea) => {
      const keywordMatches = matchedKeywords(idea, source)
      const inputMatches = matchedInputTerms(idea, terms)
      const matchedTerms = unique([...keywordMatches, ...inputMatches])
      const timeBoost = idea.budgetFit.includes(request.timeBudget) ? 8 : -4
      const keywordBoost = matchedTerms.length * 6
      const stackBoost = splitTerms(request.techStack).filter((term) => ideaText(idea).includes(term)).length * 4
      const rankScore =
        scoreSum(idea.baseScore) +
        priorityBoost[idea.priority ?? 'P2'] +
        timeBoost +
        keywordBoost +
        stackBoost +
        categoryConstraintBoost(idea, source)

      return {
        ...idea,
        matchedTerms,
        rankScore,
      }
    })
    .sort((a, b) => b.rankScore - a.rankScore || a.title.localeCompare(b.title, 'zh-Hans-CN'))
    .slice(0, Math.max(1, Math.min(request.count, seedIdeas.length)))
}
