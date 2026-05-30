import type { Locale } from '../i18n/types'
import type { AiAnalysis, WorkbenchIdea } from '../workbenchTypes'

const now = '2026-05-28T00:00:00.000Z'

export const createDefaultAnalysis = (locale: Locale): AiAnalysis =>
  locale === 'zh'
    ? {
        mvpSuggestion: '抛弃复杂账户系统，首版聚焦 local-first Kanban 心智、底部详情编辑和单条 idea 的边界评估。',
        risks: ['容易过度设计分类标签', 'LLM 补全文案可能让范围变大'],
        firstActions: ['主视图保持为单一 idea pool', '先让详情页编辑和保存稳定', '再接入后端 completion endpoint'],
        boundaryNotes: '建议把 LLM 输出作为 draft，用户通过 notes/checklist 做最终判断。',
      }
    : {
        mvpSuggestion: 'Skip the complex account system. Keep v1 focused on the local-first Kanban mental model, the bottom detail editor, and single-idea boundary review.',
        risks: ['Classification tags can get overdesigned', 'LLM completion can widen scope too early'],
        firstActions: ['Keep the main view as a single idea pool', 'Stabilize detail editing and saving first', 'Then connect the backend completion endpoint'],
        boundaryNotes: 'Treat LLM output as a draft and let the user make the final notes and checklist decisions.',
      }

export const createInitialWorkbenchIdeas = (locale: Locale): WorkbenchIdea[] =>
  locale === 'zh'
    ? [
        {
          id: 'mind-shredder',
          title: '思路清仓工具 (Mind Shredder)',
          summary: '把脑中杂念倾倒出来，再整理成可执行事项、以后再说和直接丢弃。适合作为个人 OS 的入口组件。',
          status: 'INBOX',
          source: 'local',
          tags: ['personal-os'],
          whyNow: '因为日常脑子里突然冒出的需求太多，如果不记下来会焦虑。需要一个极简的漏斗。',
          mvpScope: '一段大文本输入、自动拆条、单池卡片浏览，以及拖拽时出现的分类目标。',
          firstAction: '先做一个能把多行文本拆成条目的最小 demo。',
          scratchpad: '// write some messy thoughts or pseudo code...\n// inbox -> pipeline -> trash',
          aiEnriched: false,
          sortOrder: 100,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'agent-pack-builder',
          title: 'Agent Pack 构造器',
          summary: '一键转成给大模型使用的 markdown 任务包，包含所有上下文结构。',
          status: 'INBOX',
          source: 'local',
          tags: ['tooling'],
          whyNow: '不同 coding agent 都需要稳定上下文，标准化任务包可以减少重复解释。',
          mvpScope: '从已确认的 idea 生成 Markdown handoff，包括目标、边界、文件和验证命令。',
          firstAction: '定义 Agent Pack 模板的最小字段集合。',
          scratchpad: '- goal\n- boundaries\n- files\n- validation commands',
          aiEnriched: false,
          sortOrder: 200,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'personal-idea-hub',
          title: '个人灵感池中枢',
          summary: '把当前情绪、可用时间和偏好转成可执行的项目卡片。',
          status: 'PIPELINE',
          source: 'llm',
          tags: ['weekend-hack'],
          whyNow: '它直接服务这个工具本身，可以作为长期 dogfood 的核心用例。',
          mvpScope: '单一 idea pool、轻鉴权、SQLite 持久化、选中 idea 的 LLM 补全。',
          firstAction: '把当前静态 UI 替换为单池卡片驱动的 workbench。',
          scratchpad: 'local-first, sqlite later, llm completes only selected ideas',
          aiEnriched: true,
          aiAnalysis: {
            mvpSuggestion: '先保留本地 Kanban 心智和底部 detail editor，但主工作区只展示单一 idea pool。',
            risks: ['容易把推荐器做成泛用 dashboard', 'LLM 可能生成过宽的范围'],
            firstActions: ['确认单池卡片密度', '定义 WorkbenchIdea 数据结构', '接入本地持久化'],
            boundaryNotes: 'LLM 只补全 idea，不负责自动排序、移动或删除。',
          },
          sortOrder: 100,
          createdAt: now,
          updatedAt: now,
        },
      ]
    : [
        {
          id: 'mind-shredder',
          title: 'Mind Shredder',
          summary: 'Dump the noisy backlog in your head, then split it into doable actions, later-maybe items, and instant discard. It fits as the front door of a personal OS.',
          status: 'INBOX',
          source: 'local',
          tags: ['personal-os'],
          whyNow: 'Too many small needs show up during the day. If they are not captured quickly, they turn into anxiety.',
          mvpScope: 'One large text input, automatic line splitting, single-pool card browsing, and drag-time classification targets.',
          firstAction: 'Build the smallest demo that turns multi-line text into seed items.',
          scratchpad: '// write some messy thoughts or pseudo code...\n// inbox -> pipeline -> trash',
          aiEnriched: false,
          sortOrder: 100,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'agent-pack-builder',
          title: 'Agent Pack Builder',
          summary: 'Turn a confirmed idea into a markdown task pack for a model in one step, with the full context structure included.',
          status: 'INBOX',
          source: 'local',
          tags: ['tooling'],
          whyNow: 'Different coding agents need stable context. A standard handoff pack removes repeated explanation.',
          mvpScope: 'Generate a Markdown handoff from a confirmed idea with goal, boundaries, files, and verification commands.',
          firstAction: 'Define the smallest useful field set for the Agent Pack template.',
          scratchpad: '- goal\n- boundaries\n- files\n- validation commands',
          aiEnriched: false,
          sortOrder: 200,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'personal-idea-hub',
          title: 'Personal Idea Hub',
          summary: 'Turn current mood, available time, and preference into actionable project cards.',
          status: 'PIPELINE',
          source: 'llm',
          tags: ['weekend-hack'],
          whyNow: 'It directly serves this tool itself, so it can become a strong long-term dogfood loop.',
          mvpScope: 'A single idea pool, light auth, SQLite persistence, and LLM completion for the selected idea only.',
          firstAction: 'Replace the static UI with a workbench driven by single-pool idea cards.',
          scratchpad: 'local-first, sqlite later, llm completes only selected ideas',
          aiEnriched: true,
          aiAnalysis: {
            mvpSuggestion: 'Keep the local Kanban mental model and bottom detail editor, but let the main workspace show only one idea pool.',
            risks: ['The recommender can accidentally turn into a generic dashboard', 'LLM output can make the first scope too wide'],
            firstActions: ['Confirm single-pool card density', 'Define the WorkbenchIdea data shape', 'Connect local persistence'],
            boundaryNotes: 'LLM only completes an idea. It does not auto-rank, move, or delete items.',
          },
          sortOrder: 100,
          createdAt: now,
          updatedAt: now,
        },
      ]

export const initialWorkbenchIdeas: WorkbenchIdea[] = createInitialWorkbenchIdeas('zh')
