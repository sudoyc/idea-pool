# Personal Idea Workbench Mainline Implementation Plan

> **For Hermes:** Use `test-driven-development`, `subagent-driven-development`, OpenCode for bounded frontend/workflow implementation, and Codex for bounded backend/API implementation. The controller owns architecture, conflict prevention, verification, and final acceptance.

**Goal:** Advance the repository from a working prototype into a durable single-user local-first idea workbench with Kanban, focused spatial detail, AI augmentation, agent-facing APIs, file storage, and deployable Docker workflows.

**Architecture:** Preserve React + Vite + TypeScript + Zustand + dnd-kit on the frontend and Express + better-sqlite3 on the backend. Keep the mental model `Local-first Kanban + Spatial Detail View + AI Augmentation`; the server is a private sync/agent/storage boundary rather than a multi-user SaaS backend.

**Coordination split:**
- OpenCode owns bounded frontend/product-surface work: workspace hierarchy, detail/settings/auth presentation, interaction polish, Docker/dev workflow verification glue.
- Codex owns bounded backend/data work: schema expansion, versioned agent API, file metadata/storage, auth middleware boundaries, integration tests.
- Hermes controller writes/updates tests first, dispatches bounded tasks, reviews diffs, resolves integration seams, and runs the full quality gates.

---

## Phase 0 — Baseline and constraints

**Objective:** Establish a clean baseline and protect existing handoff docs.

**Files:**
- Read-only: `docs/handoff-workbench-redesign.md`, `docs/index-5-migration-plan.md`, `sketches/012-personal-llm-workbench/index_5.html`, `src/App.tsx`, `src/App.css`, `src/store/useIdeaStore.ts`, `server/index.ts`, `server/auth.ts`, `server/db.ts`
- Do not edit unless explicitly needed: existing untracked handoff docs under `docs/goal-hermes-personal-idea-workbench.md`, `docs/handoff-workbench-long-project.md`, `docs/handoff-workbench-redesign.md`

**TDD/verification:**
- Run baseline `npm test`, `npm run lint`, `npm run build`, `npm run build:server` before feature work.

## Phase 1 — Backend product spine (Codex-bounded)

**Objective:** Make the server a real persistent product boundary for ideas, events, completions, settings, agent context, and files.

**TDD tasks:**
1. Add failing DB tests for `idea_events`, `ai_completions`, `files`, and `settings` tables plus CRUD helpers.
2. Implement schema migrations and helper functions in `server/db.ts`.
3. Add failing app tests for versioned `/api/agent/v1/context`, `/schema`, idea CRUD, idea events, completion logging, agent pack generation, file metadata listing, and token-only agent auth.
4. Refactor `server/index.ts` to export `createApp()` and keep `listen()` only in runtime entry.
5. Implement `/api/agent/v1` routes and file storage helpers with path-safe disk writes under `DATA_DIR/files` or the database directory.
6. Re-run targeted tests, then full quality gate.

**Acceptance:**
- Agent can fetch stable context/schema with Bearer token.
- Agent can create/update/read ideas without a UI session.
- AI completion records an `ai_completions` row and an event.
- Agent pack creates file metadata and a disk artifact without putting file bodies in SQLite.

## Phase 2 — Frontend workspace product surface (OpenCode-bounded)

**Objective:** Make the visible product hierarchy more mature without changing the dark/purple developer-tool style.

**TDD tasks:**
1. Add/update store/contract tests for sync mode, selected-idea-only AI, Settings sections, and detail/back/discard semantics.
2. Implement minimal store state for `syncMode`, `lastSyncedAt`, and durable status messages.
3. Refactor `src/App.tsx` only where needed to make board, inspector, and detail read from stable contract data.
4. Improve `src/App.css` structure: better board density at 1280px, less weak right-side composition, stronger detail rail hierarchy, full-screen minimal auth, real Settings sections.
5. Re-run targeted frontend tests, then full quality gate.

**Acceptance:**
- Board remains all-columns, filter is emphasis not navigation.
- Inspector explains current selection, local/remote sync, and agent/storage affordances.
- Detail is a spatial foreground with two useful columns.
- Settings is a real read-only operational page, not a placeholder.

## Phase 3 — Integration and deployment hardening

**Objective:** Make local dev, production Docker, and personal VPS operation explicit and repeatable.

**TDD/docs tasks:**
1. Add docs for env vars, auth behavior, agent token use, data/files layout, and Docker dev/prod commands.
2. Ensure `docker-compose.yml` sets production-safe auth variables without silently accepting `change-me` as a real secret.
3. Ensure `docker-compose.dev.yml` keeps hot reload and maps persistent `data/` including `files/`.
4. Run browser smoke at 1280px and Docker-dev smoke.

**Acceptance:**
- Local dev works with API proxy.
- Production compose documents required secrets.
- Browser verifies auth, detail open/close, back behavior, Settings, and agent API reachability.

## Phase 4 — Future iteration backlog

**Deferred after this mainline slice:**
- Fine-grained note/checklist persistence per idea.
- Full file upload/download UI.
- Agent pack templates and import/export workflows.
- Conflict-aware sync across multiple browsers/devices.
- Optional reverse proxy/TLS examples for a VPS.

## Required quality gate after each phase

```bash
npm test
npm run lint
npm run build
npm run build:server
```

Browser/Docker smoke before final report:
- desktop 1280px
- detail open / close
- browser back closes detail first
- auth flow
- Docker dev flow
