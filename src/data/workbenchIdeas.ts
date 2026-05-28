import type { WorkbenchIdea } from '../workbenchTypes'

const now = '2026-05-28T00:00:00.000Z'

export const initialWorkbenchIdeas: WorkbenchIdea[] = [
  {
    id: 'mind-shredder',
    title: '思路清仓工具 (Mind Shredder)',
    summary: '把脑中杂念倾倒出来，再整理成可执行事项、以后再说和直接丢弃。适合作为个人 OS 的入口组件。',
    status: 'INBOX',
    tags: ['personal-os'],
    whyNow: '因为日常脑子里突然冒出的需求太多，如果不记下来会焦虑。需要一个极简的漏斗。',
    scratchpad: '// write some messy thoughts or pseudo code...\n// inbox -> pipeline -> trash',
    aiEnriched: false,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'agent-pack-builder',
    title: 'Agent Pack 构造器',
    summary: '一键转成给大模型使用的 markdown 任务包，包含所有上下文结构。',
    status: 'INBOX',
    tags: ['tooling'],
    whyNow: '不同 coding agent 都需要稳定上下文，标准化任务包可以减少重复解释。',
    scratchpad: '- goal\n- boundaries\n- files\n- validation commands',
    aiEnriched: false,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'personal-idea-hub',
    title: '个人灵感池中枢',
    summary: '把当前情绪、可用时间和偏好转成可执行的项目卡片。',
    status: 'PIPELINE',
    tags: ['weekend-hack'],
    whyNow: '它直接服务这个工具本身，可以作为长期 dogfood 的核心用例。',
    scratchpad: 'local-first, sqlite later, llm completes only selected ideas',
    aiEnriched: true,
    aiAnalysis: {
      mvpSuggestion: '先保留本地 Kanban 和 detail editor，不要在首版加入复杂账户系统。',
      risks: ['容易把推荐器做成泛用 dashboard', 'LLM 可能生成过宽的范围'],
      firstActions: ['还原 index_5 视觉', '定义 WorkbenchIdea 数据结构', '接入本地持久化'],
      boundaryNotes: 'LLM 只补全 idea，不负责自动排序、移动或删除。',
    },
    createdAt: now,
    updatedAt: now,
  },
]
