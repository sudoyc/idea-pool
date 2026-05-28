# Project Idea Pool Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Build a local-first web app that generates actionable vibe coding project idea cards.

**Architecture:** Use Vite + React + TypeScript as a single-page app. v1 uses deterministic local rules/templates only, with a clean data model so a future LLM provider can replace the generator without changing the UI.

**Tech Stack:** Vite, React, TypeScript, CSS modules/plain CSS, local browser APIs for copy/download.

---

## Task 1: Replace default Vite starter with app shell

**Objective:** Create the first usable single-page layout with title, intro, input panel, output panel, and docs links.

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/App.css`

**Steps:**
1. Remove default Vite demo state and assets.
2. Add a two-column responsive layout.
3. Add intro copy that explains the app is a local-first idea generator.
4. Add placeholders for form and generated cards.
5. Run `npm run build` and verify it passes.

## Task 2: Add project idea data model

**Objective:** Define the TypeScript types used by generation and rendering.

**Files:**
- Create: `src/types.ts`

**Types:**
- `TimeBudget`
- `IdeaCategory`
- `IdeaScore`
- `ProjectIdea`
- `IdeaRequest`

**Verification:**
- Import the types from `App.tsx`.
- Run `npm run build`.

## Task 3: Add seed idea catalog

**Objective:** Encode the ideas from `docs/idea-pool.md` as structured data.

**Files:**
- Create: `src/data/seedIdeas.ts`

**Content:**
- Include all 21 recorded ideas.
- Mark “个人项目灵感池 Agent” as priority.
- Include category, title, summary, mvp, firstStep, techStack, expansion.

**Verification:**
- Render a default list from the catalog.
- Confirm all cards appear.

## Task 4: Build deterministic idea generator

**Objective:** Filter and rank idea cards based on user input.

**Files:**
- Create: `src/lib/generateIdeas.ts`

**Rules:**
- Match keywords from interest/context/constraints.
- Boost ideas matching selected tech stack.
- Boost short-time-budget ideas when time is limited.
- Always keep priority idea near the top.
- Return requested count.

**Verification:**
- Add a few inline example calls during development or simple unit-like assertions if test tooling is added later.
- Run `npm run build`.

## Task 5: Implement input form

**Objective:** Let the user describe current mood, time, stack, constraints, and desired output count.

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/App.css`

**Fields:**
- Interest/context textarea
- Time budget select
- Tech stack text input
- Constraints textarea
- Idea count select

**Verification:**
- Change fields and confirm generated results update on submit.

## Task 6: Implement idea card rendering

**Objective:** Make each generated idea actionable at a glance.

**Files:**
- Create: `src/components/IdeaCard.tsx`
- Modify: `src/App.tsx`
- Modify: `src/App.css`

**Card sections:**
- Title and category
- Summary
- Why now
- MVP
- First 30-minute action
- Recommended stack
- Expansion path
- Score chips

**Verification:**
- All cards fit on desktop and mobile.
- Priority project is visibly marked.

## Task 7: Add markdown export and copy

**Objective:** Allow generated ideas to be reused in another agent or note.

**Files:**
- Create: `src/lib/markdown.ts`
- Modify: `src/App.tsx`

**Actions:**
- Copy generated markdown to clipboard.
- Download generated markdown as `project-ideas.md`.

**Verification:**
- Copy works in browser.
- Downloaded file contains selected ideas and form context.

## Task 8: Polish README and developer workflow

**Objective:** Make the project easy to run and extend.

**Files:**
- Modify: `README.md`

**Content:**
- What the app does.
- Install/run/build commands.
- Current local-only limitation.
- Future LLM integration plan.

**Verification:**
- Run `npm install`.
- Run `npm run build`.
- Optionally run `npm run dev` and inspect in browser.
