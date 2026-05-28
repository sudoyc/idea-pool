# UI Redesign Handoff for Codex / OpenCode

> 交付目标：把 `project-idea-pool` 的下一轮前端设计开发交给 Codex 或 OpenCode。下一步不要急着改生产 React 页面；先做可打开的 HTML mockup，让用户比较结构布局和字体排版，再选一个方向落地。

## 0. Executive Summary

当前产品是一个本地优先的「个人项目灵感池 Agent」：用户输入当前状态、时间、技术栈和约束，系统推荐可以 vibe coding 的项目 idea。

现有 MVP 已可运行，但美术问题不只是颜色，而是：

1. 页面结构像普通 SaaS dashboard。
2. 左表单右卡片网格过于机械。
3. idea card 信息过重，强行塞进卡片导致拥挤。
4. 字体层级、中文阅读、标签/正文/标题比例都偏硬。
5. 缺少“私人工作台 / 开发者外脑 / 灵感池”的长期使用气质。

下一步推荐：

- Phase 1：只做 mockup，不改 `src/` 生产代码。
- Phase 2：用户选定方向后，再把选中的 layout/typography 落到 React/CSS。

## 1. Repository Context

Workdir:

```bash
/home/ycyc/projects/project-idea-pool
```

Stack:

- Vite
- React
- TypeScript
- no backend
- local-first
- deterministic local generator

Current verification commands:

```bash
npm test
npm run lint
npm run build
```

These commands passed in the current MVP before this handoff.

Current important files:

```text
docs/idea-pool.md                    # 21 个 vibe coding idea
docs/product-brief.md                # 产品说明
docs/implementation-plan.md          # 初始实施计划
src/App.tsx                          # 当前生产 React 页面
src/App.css                          # 当前生产样式
src/index.css                        # 全局 CSS tokens
src/data/seedIdeas.ts                # 21 个 seed ideas
src/generator.ts                     # 本地推荐排序逻辑
src/markdown.ts                      # Markdown 导出逻辑
src/components/IdeaCard.tsx          # 当前卡片组件
src/generator.test.ts                # generator tests
src/markdown.test.ts                 # markdown export tests
```

Existing sketches already made, but they are only rough explorations and not final:

```text
sketches/001-linear-project-radar/index.html
sketches/002-raycast-command-nebula/index.html
sketches/003-purple-notebook-desk/index.html
sketches/screenshots/contact-sheet.png
```

The user still thinks layout and typography are the hard problems, so do not simply polish these existing sketches with more gradients. Use them only as reference for what did not fully work.

Git status note:

- The repo currently has no initial commit on `main` and many untracked files.
- Do not delete or overwrite existing docs/sketches/src files unless explicitly asked.
- Do not stage broad directories blindly.

## 2. Product Requirements

The application inputs:

- 当前心情 / 方向
- 可用时间
- 偏好技术栈
- 约束
- 输出数量

The application outputs project idea recommendations. Each idea can include:

- title
- category / priority
- summary
- why now
- MVP scope
- first 30-minute action
- recommended stack
- tags
- score

The value proposition is not “dashboard analytics”. It is:

> 把“想写点东西但不知道写什么”的冲动，转成一个可以立刻开始的项目。

## 3. Design Problem Statement

This project must not feel like:

- a generic SaaS admin dashboard
- a fake metric dashboard
- a grid of AI-generated cards
- a glassmorphism demo
- a random purple gradient landing page

The redesign must focus on:

1. structure/layout
2. typography hierarchy
3. reading comfort
4. input/output relationship
5. long-term personal workspace feel

Color direction:

- dark mode
- purple-related accent
- but color is secondary to layout and typography

## 4. Gemini Design Directions to Prototype

A Gemini design review proposed five directions. Build concrete HTML mockups for all five, or at minimum the first two if time is constrained.

### Direction A — Raycast / Command Feed

Core: efficiency, command-first, no dashboard.

Layout:

- single-column centered
- max width around 680-760px
- command bar at the top
- output is an accordion list / command feed
- no grid cards
- rows show title + short line + score by default
- click row to expand details inline

Typography:

- command bar text can be 22-24px
- row title 15-17px semibold
- body 14-15px, line-height 1.6
- mono only for stack tags or command snippets

### Direction B — IDE Split-Pane

Core: long-term workspace/library, best candidate for V1.

Layout:

- 100vh app layout
- fixed sidebar around 300-340px
- right detail pane `1fr`
- left top: compact input controls
- left bottom: idea/history list
- right side: selected idea as readable document
- body should not scroll as one page; panes scroll independently

Typography:

- sidebar 12-13px compact
- detail h1 around 30-36px
- detail h2 around 18-22px with large top margin
- body 15-16px, line-height 1.65-1.75
- first 30-minute action as callout / terminal action block

### Direction C — Focus Deck

Core: decision support, one idea at a time.

Layout:

- centered viewport
- one large idea card only
- form collapses into a top pill after generation
- card stack effect optional
- below card: reject / pin / next actions

Typography:

- title 36-48px
- body 16px, line-height 1.6
- metadata tiny and wide-tracked
- can consider a more editorial display font, but avoid hurting Chinese readability

### Direction D — Terminal Logbook

Core: hacker log, no cards.

Layout:

- no rounded cards, no shadows
- output is continuous log text
- prompt-like input at top
- ideas formatted as structured terminal sections
- copy-friendly plain text

Typography:

- mostly JetBrains Mono / Fira Code
- title 15-16px
- body 13-14px, line-height 1.4-1.5
- hierarchy via color, indentation, section labels

### Direction E — Interactive Notion Block

Core: writing surface, output as document.

Layout:

- narrow centered document, max width around 680-760px
- inline sentence input, not boxed form
- output as rich text document with h2 sections
- idea details read like a generated note
- first action as checkbox/todo block

Typography:

- inline form / opening sentence 22-28px
- body 16px, line-height 1.7-1.85
- generous paragraph spacing
- minimal boxes; use whitespace and section rhythm

## 5. Phase 1 Required Deliverables — Mockups Only

Create these files:

```text
sketches/004-raycast-command-feed/index.html
sketches/004-raycast-command-feed/README.md

sketches/005-ide-split-pane/index.html
sketches/005-ide-split-pane/README.md

sketches/006-focus-deck/index.html
sketches/006-focus-deck/README.md

sketches/007-terminal-logbook/index.html
sketches/007-terminal-logbook/README.md

sketches/008-interactive-notion-block/index.html
sketches/008-interactive-notion-block/README.md
```

Each HTML must be:

- complete standalone HTML
- directly openable in a browser
- no build step
- inline CSS
- inline minimal JS
- no complex external libraries
- Google Fonts allowed, but system font stack is fine
- real project content, no Lorem Ipsum
- dark purple mode
- focused on layout and typography

Each README must include:

```markdown
## Variant: Name

### Design stance

### Key layout choices

### Typography choices

### Interactions

### Strong at

### Weak at

### Best for
```

Recommended sample content is in `docs/idea-pool.md` and `src/data/seedIdeas.ts`. Use at least these five ideas:

1. 个人项目灵感池 Agent
2. Agent Pack 生成器
3. 思路清仓工具
4. README Hero 生成器
5. 个人服务目录

## 6. Phase 1 Acceptance Criteria

A mockup phase is complete when:

- All five `index.html` files exist.
- All five READMEs exist.
- Each HTML opens in browser without console errors.
- No horizontal overflow at 1280px width.
- Ideally test at mobile-ish width too, or at least avoid fixed desktop-only assumptions except IDE Split-Pane.
- At least one meaningful interaction exists per mockup:
  - accordion expand/collapse
  - selected idea detail changes
  - next/previous card
  - toast after copy/pin/generate
  - prompt-like input action
- Generate screenshots if browser tooling is available:

```text
sketches/screenshots/004-raycast-command-feed.png
sketches/screenshots/005-ide-split-pane.png
sketches/screenshots/006-focus-deck.png
sketches/screenshots/007-terminal-logbook.png
sketches/screenshots/008-interactive-notion-block.png
sketches/screenshots/contact-sheet-v2.png
```

Do not edit production `src/` files in Phase 1.

## 7. Phase 2 — Implement Selected Direction in React

Only start Phase 2 after the user selects a direction.

Likely best V1 direction:

- IDE Split-Pane, optionally with Raycast-like command input in the sidebar.

Production implementation constraints:

- Keep local-first behavior.
- Keep generator logic in `src/generator.ts` unless there is a clear reason to change it.
- Keep seed data in `src/data/seedIdeas.ts`.
- Keep Markdown export via `src/markdown.ts`.
- Replace layout in `src/App.tsx` and styling in `src/App.css` / `src/index.css`.
- Existing tests must keep passing.
- Add tests only if you change generator/export logic.

Likely React structure for IDE Split-Pane:

```text
src/App.tsx
  AppShell
    Sidebar
      CompactPromptForm
      IdeaList
    DetailPane
      IdeaDetail
      ActionCallout
      DetailActions

src/components/
  CompactPromptForm.tsx
  IdeaList.tsx
  IdeaDetail.tsx
  ActionCallout.tsx
```

State:

```ts
const [request, setRequest] = useState<IdeaRequest>(initialRequest)
const [ideas, setIdeas] = useState<GeneratedIdea[]>(() => generateIdeas(initialRequest))
const [selectedIdeaId, setSelectedIdeaId] = useState(ideas[0]?.id)
```

When generating new ideas:

- recompute ideas
- select the first generated idea
- show small status/toast

## 8. Typography Guidance for Implementation

Default font stack:

```css
font-family:
  Inter, "Noto Sans SC", "PingFang SC", "Microsoft YaHei", system-ui,
  -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
```

Mono stack:

```css
font-family:
  "JetBrains Mono", "Fira Code", ui-monospace, SFMono-Regular, Menlo,
  Monaco, Consolas, monospace;
```

Baseline suggestions:

```css
body: 15px or 16px / 1.65
sidebar item: 12px-14px / 1.45
h1 detail title: 32px-38px / 1.05, weight 650-750
h2 section: 18px-22px / 1.25, weight 650
metadata/tag: 11px-12px / 1.3, weight 600, subdued
button: 13px-14px, weight 650-750
```

Rules:

- Do not use bold everywhere.
- Do not use monospace everywhere unless implementing Terminal Logbook.
- Do not make every tag a bordered pill.
- Use whitespace and type scale before adding boxes.
- Use purple accent sparingly for active state, selected item, primary action, and first-action callout.

## 9. What Not To Do

Do not:

- Add backend/auth/database.
- Add LLM API integration.
- Replace the local deterministic generator.
- Turn it into a generic analytics dashboard.
- Add fake charts or fake metrics.
- Use heavy glassmorphism.
- Depend on Tailwind unless the project already uses it. It currently does not.
- Delete existing docs/sketches.
- Commit `node_modules` or generated `dist` output.

## 10. Verification Commands

For Phase 1 mockups:

```bash
# no build required; open each HTML in browser
# if using a static server:
python3 -m http.server 8080
```

For Phase 2 React implementation:

```bash
npm test
npm run lint
npm run build
```

If running local dev server:

```bash
npm run dev -- --host 127.0.0.1
```

Then check:

- Browser console has no errors.
- No horizontal overflow.
- Main user path works: edit prompt -> generate -> select idea -> copy/download Markdown.

## 11. Suggested OpenCode Command

From repo root:

```bash
opencode run 'Read docs/handoff-ui-redesign-codex-opencode.md. Complete Phase 1 only: create the five standalone HTML mockups and READMEs under sketches/004-* through sketches/008-*. Do not edit src/ production files. Focus on layout and typography, not gradients. After writing files, report paths and any browser verification you performed.'
```

## 12. Suggested Codex Command

From repo root:

```bash
codex exec 'Read docs/handoff-ui-redesign-codex-opencode.md. Complete Phase 1 only: create the five standalone HTML mockups and READMEs under sketches/004-* through sketches/008-*. Do not edit src/ production files. Focus on layout and typography, not gradients. After writing files, report paths and any browser verification you performed.'
```

Remember: Codex requires a git repository. This repo currently is a git repo with no initial commit.

## 13. Review Checklist Before Returning to User

- [ ] Did the agent create concrete HTML, not just prose?
- [ ] Are structure and typography obviously different across the five directions?
- [ ] Did it avoid generic card-grid SaaS?
- [ ] Did it preserve production `src/` during Phase 1?
- [ ] Are filenames and READMEs present?
- [ ] Are screenshots/contact sheet generated if possible?
- [ ] If production React was changed, did `npm test && npm run lint && npm run build` pass?
