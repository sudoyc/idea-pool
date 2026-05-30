# Personal Idea Workbench Five-Phase Product Mainline Plan

> **For Hermes:** Use `subagent-driven-development` to execute this plan phase-by-phase. The controller owns architecture, RED tests, task boundaries, review, integration, verification, commits, and push decisions. Use OpenCode for bounded frontend/product-surface implementation and Docker/dev workflow glue. Use Codex for bounded backend/data/API design and read-only structural review.

**Goal:** Complete the next five product phases so Personal Idea Workbench becomes a durable single-user local-first idea system with real settings, stable agent access, evented data, a mature spatial detail view, and repeatable local/VPS operation.

**Architecture:** Preserve React + Vite + TypeScript + Zustand + dnd-kit on the frontend and Express + better-sqlite3 + SQLite on the backend. The product model remains `Local-first Kanban + Spatial Detail View + AI Augmentation`: one personal idea pool, status as metadata, focused detail overlay, AI only expands the selected idea, and agent access is private/token-controlled rather than a multi-user SaaS surface.

**Tech Stack:** React 19, Vite 8, TypeScript, Zustand, dnd-kit, Radix Dropdown Menu, Express 5, better-sqlite3, Vitest, ESLint, Docker Compose.

---

## Current baseline and boundaries

### Baseline as of this plan

- `main` is in sync with `origin/main` at the Settings v1 form-flow work.
- Settings v1 is implemented and verified:
  - centered 768px form flow
  - editable workspace/model/agent exposure controls
  - read-only mechanism/status section
  - `src/settingsClient.ts` fallback behavior for failed `/api/settings`
- Full quality gate was previously green:
  - `npm test`
  - `npm run lint`
  - `npm run build`
  - `npm run build:server`
- Docker dev and production smoke were previously verified.

### Dirty / preserved local files

Do not stage or modify unless the user explicitly says so:

- `sketches/016-settings-console-mockup/index_2.html`

This is a local reference file and is intentionally untracked.

### Non-negotiable product constraints

- Keep the existing app shell: left sidebar, topbar, single main workspace, bottom spatial detail overlay.
- Keep the accepted main view: single `idea pool` card field, not a permanent three-column SaaS board.
- Keep the visual style: dark developer-tool surface, purple accent, restrained hierarchy, no decorative noise/glassmorphism escalation.
- Keep AI constrained: AI expands only the selected idea or explicitly addressed idea; it must not choose which idea to work on by itself.
- Keep single-user/private deployment assumptions; no multi-tenant SaaS abstractions.
- Keep all copy in i18n where user-facing.
- Follow strict TDD: RED first, verify failure, GREEN minimal implementation, refactor under tests.

### Universal phase gate

Run this after each phase and after any non-trivial integration fix:

```bash
npm test
npm run lint
npm run build
npm run build:server
```

Runtime gate for phases that affect UI/API/deployment:

```bash
docker compose -f docker-compose.dev.yml up -d --build --force-recreate --renew-anon-volumes idea-workbench-dev
curl -fsS http://127.0.0.1:5173/ >/tmp/piw-ui.html
curl -fsS http://127.0.0.1:3001/api/health
```

Browser checks when UI changes:

- desktop width around 1280px
- Settings open/close
- detail open/close
- browser back closes detail first
- no horizontal overflow
- browser console has no errors
- Chinese default UI still renders correctly

Production smoke when auth/deployment/settings/storage changes:

- start production compose on non-default port, for example `IDEA_POOL_PORT=4180`
- verify `/api/health`
- verify auth-required session route behavior
- verify agent bearer route behavior
- clean up production container and restore any QA settings written during smoke

---

## Coordination model

### Hermes controller responsibilities

1. Read the current state before every phase:
   - `git status --short --branch`
   - `git log -3 --oneline`
   - relevant files/tests for the phase
2. Write RED tests in the controller session before delegating implementation.
3. Verify RED with targeted `npm test -- ...` command.
4. Dispatch bounded implementation to OpenCode or Codex with exact scope and target tests.
5. Inspect diff manually after each subagent run.
6. Run targeted tests, then full quality gate.
7. Run browser/Docker smoke when relevant.
8. Commit each phase as a cohesive commit, never broad `git add .`.
9. Push only after user confirmation or when the user has explicitly authorized push for that batch.

### OpenCode responsibilities

Use OpenCode for:

- Settings UI controls and interaction polish.
- Detail View v2 layout, keyboard shortcuts, empty states, browser interaction details.
- Frontend store integration and i18n wiring.
- Docker/dev workflow glue and browser verification fixes.
- Operator docs formatting and frontend-facing docs links.

OpenCode prompts must include:

- accepted product constraints
- files in scope
- files out of scope
- RED tests and target command
- instruction to run target tests and report exact output

### Codex responsibilities

Use Codex for:

- settings schema and secret handling review
- database migrations and repository shape review
- versioned Agent API contracts
- auth/token boundary review
- data consistency and file-storage review
- read-only final reviews after each phase

Codex review prompts must be narrowed. If full review times out or upstream is unavailable, retry once with a verdict-only prompt. If full quality gate and browser/runtime smoke are green, do not let Codex availability block the phase indefinitely; record the limitation honestly.

---

# Phase 1 — Settings v2: real configuration center

## Objective

Turn Settings from a polished first surface into a real local-first configuration center that persists workspace, model, secret, storage, backup, and runtime endpoint configuration without leaking secrets or confusing backend/frontend/agent boundaries.

## Product outcome

Settings should have two sections:

1. Editable configuration
   - Workspace name
   - LLM API key secret input
   - LLM model selector/free text fallback
   - Embedding model selector/free text fallback
   - Local storage path display/config value
   - Backup/export action
   - Agent exposure / base path
2. Read-only mechanism status
   - Backend API address
   - Frontend dev/prod port explanation
   - Agent base route
   - Auth mode
   - Data directory
   - Files directory
   - Last backup/export metadata

Secret handling rules:

- API key must be write-only from the UI.
- `GET /api/settings` must never return the raw API key.
- UI should show whether a secret is configured, not the value.
- Saving an empty secret field must not accidentally erase the existing secret unless the user explicitly clicks “clear key”.

## TDD tasks

### Task 1.1 — Define Settings schema contract

**Owner:** Hermes controller writes RED, Codex can implement backend.

**Files:**

- Create: `server/settings-schema.test.ts`
- Modify: `server/index.ts`
- Modify: `server/db.ts`
- Modify: `server/types.ts`

**RED test expectations:**

- `GET /api/settings` returns:
  - `schemaVersion`
  - `settings.workspaceName`
  - `settings.llmModel`
  - `settings.embeddingModel`
  - `settings.agentBasePath`
  - `settings.agentExposure`
  - `settings.storagePath`
  - `secrets.llmApiKeyConfigured`
  - no `llmApiKey` raw value
- `PUT /api/settings` accepts editable non-secret fields.
- `PUT /api/settings` accepts `{ secrets: { llmApiKey: "..." } }` and stores it without returning it.
- `PUT /api/settings` with an empty `secrets.llmApiKey` preserves the existing key.
- `DELETE /api/settings/secrets/llmApiKey` clears the key.

**Run RED:**

```bash
npm test -- server/settings-schema.test.ts
```

Expected: fail because schema/secrets are missing.

**GREEN implementation notes:**

- Keep settings storage in SQLite `settings` table for now; no new secret manager dependency.
- Store secret under a separate key such as `secret.llmApiKey`.
- Add helper functions:
  - `getSettingsSummary()`
  - `updateSettingsPatch()`
  - `setSecret()`
  - `clearSecret()`
- Do not log secret values.

**Target pass:**

```bash
npm test -- server/settings-schema.test.ts server/auth.test.ts server/agent-api.test.ts
```

### Task 1.2 — Extend frontend settings client

**Owner:** Hermes RED, OpenCode implementation.

**Files:**

- Modify: `src/settingsClient.ts`
- Modify: `src/settingsClient.test.ts`

**RED test expectations:**

- `loadWorkbenchSettings()` parses `schemaVersion`, `settings`, `secrets`, and `runtime` metadata.
- Non-OK fallback still returns local defaults and `usedDefaults: true`.
- `saveWorkbenchSettings()` sends secrets only when the user enters a non-empty key.
- `clearWorkbenchSecret('llmApiKey')` calls `DELETE /api/settings/secrets/llmApiKey`.
- Raw secret values never appear in returned client state.

**Run RED:**

```bash
npm test -- src/settingsClient.test.ts
```

### Task 1.3 — Expand Settings product model and i18n

**Owner:** Hermes RED, OpenCode implementation.

**Files:**

- Modify: `src/workbenchProductModel.ts`
- Modify: `src/workbenchProductModelI18n.test.ts`
- Modify: `src/i18n/messages.ts`
- Modify: `src/i18n/messages.test.ts`

**RED test expectations:**

- Editable settings include:
  - workspaceName
  - llmApiKey
  - llmModel
  - embeddingModel
  - storagePath
  - backupNow
  - agentExposure
- Read-only settings include:
  - backend address
  - frontend port
  - agent base path
  - auth mode
  - data directory
  - files directory
- Chinese and English catalogs are complete.
- Product model functions are locale-aware and do not branch on raw `locale === 'zh'` except shared date/time locale mapping if already present.

### Task 1.4 — Implement Settings v2 UI

**Owner:** OpenCode.

**Files:**

- Modify: `src/App.tsx`
- Modify: `src/App.css`
- Modify: `server/settings-production-surface.test.ts`
- Modify: `src/polishedInteractions.test.ts`

**RED test expectations:**

- Settings still uses `.settings-container` with `max-width: 768px`.
- No return to `.settings-grid`, `.settings-card--hero`, `.settings-orbit`.
- API key input is `type="password"` or write-only equivalent and never prefilled with the secret.
- Secret configured state is visible via semantic i18n copy.
- Clear key action exists and is separate from saving empty field.
- Backup action button exists and is not fake: it calls a real API endpoint added in Task 1.5.

### Task 1.5 — Add backup/export endpoint

**Owner:** Codex backend, OpenCode UI glue if needed.

**Files:**

- Create: `server/backup.test.ts`
- Modify: `server/index.ts`
- Modify: `server/db.ts` or new `server/backup.ts`
- Modify: `server/storage.ts`
- Modify: `docs/operator-guide.md` if created in Phase 5, otherwise `docs/personal-idea-workbench-mainline-plan.md` or new docs file

**RED test expectations:**

- `POST /api/settings/backup` requires session/token auth.
- It creates a backup metadata record or settings value with timestamp/path.
- It writes a deterministic JSON export under data/backup or returns a downloadable export file metadata.
- It does not include raw LLM API keys in the export.

**Target pass:**

```bash
npm test -- server/backup.test.ts server/settings-schema.test.ts src/settingsClient.test.ts
```

## Phase 1 acceptance gate

- Full quality gate passes.
- Browser Settings v2 verifies:
  - secret field starts empty even when configured
  - setting a key shows configured state
  - empty save does not clear it
  - clear key clears configured state
  - backup action returns success and updates last backup metadata
- Docker dev `/api/settings` and backup smoke pass.
- Codex read-only review: settings schema, secret safety, no raw secret response.

**Suggested commit:**

```bash
git add server/settings-schema.test.ts server/backup.test.ts server/index.ts server/db.ts server/storage.ts src/settingsClient.ts src/settingsClient.test.ts src/workbenchProductModel.ts src/workbenchProductModelI18n.test.ts src/i18n/messages.ts src/i18n/messages.test.ts src/App.tsx src/App.css server/settings-production-surface.test.ts src/polishedInteractions.test.ts
git commit -m "feat(settings): add schema secrets and backup controls"
```

---

# Phase 2 — Agent API v1 hardening

## Objective

Make Agent API v1 a stable private automation contract with explicit versioning, capabilities, auth boundaries, context rules, idea operations, file handoff, and docs that match server behavior.

## Product outcome

External agents can safely:

- authenticate with Bearer token only
- read workspace context and rules
- discover schema/capabilities
- list/read/create/update explicitly addressed ideas
- record events
- request completion for a selected/explicit idea
- upload/download/list/delete handoff files
- generate agent pack markdown

Agents cannot:

- use session cookies on agent-only endpoints
- retrieve UI session credentials
- retrieve raw secrets
- autonomously choose arbitrary ideas for AI enrichment without an explicit idea id

## TDD tasks

### Task 2.1 — Formalize Agent API contract tests

**Owner:** Hermes RED, Codex implementation.

**Files:**

- Create: `server/agent-api-contract.test.ts`
- Modify: `server/agent-api.test.ts`
- Modify: `server/api-v1-hardening.test.ts`
- Modify: `server/index.ts`

**RED test expectations:**

- Every `/api/agent/v1/*` route requires Bearer token.
- Session cookie alone is rejected for agent endpoints.
- Invalid Bearer token is rejected.
- `GET /context` returns:
  - `api.version: "v1"`
  - `workspace.name` from settings, not hardcoded default only
  - `rules.localFirst: true`
  - `rules.aiSelectedIdeaOnly: true`
  - `capabilities` array with stable names
  - `limits.maxUploadBytes`
- `GET /schema` returns statuses/sources/fileKinds plus JSON-like field metadata.

**Run RED:**

```bash
npm test -- server/agent-api-contract.test.ts server/agent-api.test.ts
```

### Task 2.2 — Add typed response builders

**Owner:** Codex.

**Files:**

- Create: `server/agent-contract.ts`
- Modify: `server/types.ts`
- Modify: `server/index.ts`

**Implementation notes:**

- Avoid ad hoc route JSON construction in route handlers.
- Add builders:
  - `buildAgentContext(settings, runtime)`
  - `buildAgentSchema()`
  - `buildAgentCapabilities()`
- Tests should import builders where useful to avoid brittle string checks.

### Task 2.3 — Harden idea operations

**Owner:** Codex backend, Hermes review.

**Files:**

- Modify: `server/agent-api-contract.test.ts`
- Modify: `server/index.ts`
- Modify: `server/db.ts`

**RED test expectations:**

- `POST /api/agent/v1/ideas` creates source `agent` idea and event `created_by_agent`.
- `PATCH /api/agent/v1/ideas/:id` updates only allowed fields.
- Invalid status/source is rejected with 400.
- Patch creates event `updated_by_agent` with changed fields.
- Delete is not exposed to agent unless explicitly designed; if exposed, archived-only rule must apply.

### Task 2.4 — Harden file handoff endpoints

**Owner:** Codex backend.

**Files:**

- Create: `server/agent-files-contract.test.ts`
- Modify: `server/index.ts`
- Modify: `server/storage.ts`
- Modify: `server/db.ts`

**RED test expectations:**

- Path traversal filenames are rejected.
- Empty filenames are rejected.
- Oversized content is rejected according to a single limit constant.
- Upload creates both disk artifact and file metadata.
- Deleting a file removes metadata and disk artifact.
- Download sets a sane `Content-Type`.

### Task 2.5 — Update Agent API docs and examples

**Owner:** Hermes/OpenCode docs, Codex review.

**Files:**

- Modify: `docs/agent-api.md`
- Modify: `server/agent-docs.test.ts`

**RED test expectations:**

- Docs include all actual routes.
- Docs do not include malformed curl examples.
- Docs state Bearer token auth.
- Docs state AI selected-idea-only rule.
- Docs state secrets are never returned.

## Phase 2 acceptance gate

- Targeted agent tests pass.
- Full quality gate passes.
- Docker dev smoke:
  - invalid token returns 401
  - valid token returns context/schema/settings
  - create idea via agent token
  - upload handoff file
  - download handoff file
- Codex read-only review: agent auth, versioning, explicit idea rule, docs-route parity.

**Suggested commit:**

```bash
git add server/agent-api-contract.test.ts server/agent-files-contract.test.ts server/agent-contract.ts server/index.ts server/db.ts server/storage.ts server/types.ts docs/agent-api.md server/agent-docs.test.ts server/api-v1-hardening.test.ts server/agent-api.test.ts
git commit -m "feat(agent): harden v1 contract and file handoff"
```

---

# Phase 3 — Data model and event log

## Objective

Make the SQLite model durable enough for long-term product iteration: explicit events, AI completion records, file consistency, settings schema version, and future sync/conflict support.

## Product outcome

The product should be able to answer:

- What changed on an idea?
- Who/what changed it: local UI, agent, import, LLM?
- What AI completion produced this suggestion?
- Which files belong to this idea and do they still exist on disk?
- What schema/settings version is this workspace using?
- Can backup/export include meaningful audit history without secrets?

## TDD tasks

### Task 3.1 — Add schema metadata and migration contract

**Owner:** Codex.

**Files:**

- Create: `server/db-schema-version.test.ts`
- Modify: `server/db.ts`
- Modify: `server/types.ts`

**RED test expectations:**

- DB has a schema metadata key/table with current app schema version.
- `ensureSchema()` is idempotent.
- Existing minimal DB migrates without losing ideas.
- Settings include `schemaVersion` in API summary.

### Task 3.2 — Formalize idea event types

**Owner:** Codex.

**Files:**

- Create: `server/idea-events.test.ts`
- Modify: `server/types.ts`
- Modify: `server/db.ts`
- Modify: `server/index.ts`

**RED test expectations:**

- Typed event names exist for:
  - `idea_created`
  - `idea_updated`
  - `idea_status_changed`
  - `idea_archived`
  - `idea_deleted`
  - `file_uploaded`
  - `file_deleted`
  - `ai_completion_requested`
  - `ai_completion_succeeded`
  - `ai_completion_failed`
  - `agent_pack_created`
- Events record `actor`, `payload`, `createdAt`, and `ideaId`.
- Updating status records previous/new status.
- File upload/delete records file id and filename.

### Task 3.3 — Improve AI completion records

**Owner:** Codex backend.

**Files:**

- Create: `server/ai-completions-contract.test.ts`
- Modify: `server/llm.ts`
- Modify: `server/index.ts`
- Modify: `server/db.ts`

**RED test expectations:**

- Completion record includes:
  - provider
  - model from settings/env
  - prompt hash
  - input summary
  - output JSON
  - status `succeeded` or `failed`
  - error if failed
- Failure records an event and does not corrupt the idea.
- Success updates only the explicit idea id.

### Task 3.4 — Add file consistency checks

**Owner:** Codex backend.

**Files:**

- Create: `server/file-storage-consistency.test.ts`
- Modify: `server/storage.ts`
- Modify: `server/db.ts`
- Modify: `server/index.ts`

**RED test expectations:**

- Repository can list orphaned metadata where disk file is missing.
- Repository can list orphaned disk files where metadata is missing.
- A maintenance endpoint or internal helper can report consistency summary.
- No automatic destructive cleanup unless explicitly requested.

### Task 3.5 — Surface event history in Detail rail

**Owner:** OpenCode frontend.

**Files:**

- Create: `src/detailEventsModel.test.ts`
- Modify: `src/App.tsx`
- Modify: `src/App.css`
- Modify: `src/i18n/messages.ts`
- Modify: `src/i18n/messages.test.ts`

**RED test expectations:**

- Detail rail has an event history section.
- Events are rendered as concise, readable rows.
- Empty event history has a quiet empty state.
- UI copy is i18n-backed.
- Event history does not crowd core idea fields.

## Phase 3 acceptance gate

- Targeted DB/event/completion/file tests pass.
- Full quality gate passes.
- Browser detail view shows event history without breaking layout.
- Docker dev smoke verifies idea update creates event rows.
- Codex read-only review: migration safety, event taxonomy, completion failure behavior, file consistency.

**Suggested commit:**

```bash
git add server/db-schema-version.test.ts server/idea-events.test.ts server/ai-completions-contract.test.ts server/file-storage-consistency.test.ts server/db.ts server/index.ts server/llm.ts server/storage.ts server/types.ts src/detailEventsModel.test.ts src/App.tsx src/App.css src/i18n/messages.ts src/i18n/messages.test.ts
git commit -m "feat(data): add evented idea history and completion audit"
```

---

# Phase 4 — Detail View v2: mature spatial foreground

## Objective

Turn the detail overlay into a mature spatial working surface, not just a form: stable hierarchy, focused writing fields, AI boundary, handoff/files, metadata, event history, and keyboard/browser behavior.

## Product outcome

The Detail View should feel like the focused foreground of the workbench:

- open from idea card into bottom spatial overlay
- preserve browser back/forward behavior
- expose core idea fields first
- keep AI boundary and file handoff as supporting tools
- show metadata/events without becoming a right-rail dashboard
- support keyboard actions for long-term use

## TDD tasks

### Task 4.1 — Extract detail view model

**Owner:** Hermes RED, OpenCode implementation.

**Files:**

- Create: `src/detailViewModel.test.ts`
- Create: `src/detailViewModel.ts`
- Modify: `src/App.tsx`

**RED test expectations:**

- `buildDetailSections(idea, locale)` returns stable sections:
  - essence
  - timing
  - scope
  - action
  - aiBoundary
  - files
  - events
  - metadata
- Archived ideas expose delete permanently; non-archived ideas expose archive only.
- Empty fields get quiet placeholders from i18n.

### Task 4.2 — Implement keyboard shortcuts safely

**Owner:** OpenCode.

**Files:**

- Create: `src/detailKeyboard.test.ts`
- Modify: `src/App.tsx`
- Modify: `src/polishedInteractions.test.ts`

**RED test expectations:**

- Escape closes detail when focus is not inside an active text composition scenario.
- Ctrl/Cmd+S saves current detail changes.
- N creates a new seed only when detail text input is not focused.
- Browser back still closes detail first.

Implementation note:

- If keyboard behavior is hard to test without DOM libraries, keep pure helper functions testable and verify final behavior in browser smoke.

### Task 4.3 — Refine Detail v2 layout

**Owner:** OpenCode.

**Files:**

- Modify: `src/App.tsx`
- Modify: `src/App.css`
- Modify: `src/polishedInteractions.test.ts`

**RED test expectations:**

- Detail overlay keeps bottom spatial open behavior.
- No permanent right inspector rail returns.
- Core writing fields remain visually primary.
- AI and file handoff are secondary modules.
- Metadata/events are readable but subdued.
- 1280px viewport has no horizontal overflow.

### Task 4.4 — Improve AI boundary panel

**Owner:** OpenCode frontend, Codex backend review.

**Files:**

- Modify: `src/App.tsx`
- Modify: `src/workbenchProductModel.ts`
- Modify: `src/workbenchProductModelI18n.test.ts`
- Modify: `server/ai-completions-contract.test.ts`

**RED test expectations:**

- Button copy and help text explicitly say selected idea only.
- Completion request includes current selected idea id.
- UI cannot trigger completion with no selected idea.
- Completion result updates only selected idea and logs event/completion from Phase 3.

### Task 4.5 — Browser interaction dogfood

**Owner:** Hermes controller.

**Manual verification checklist:**

- Open detail from card.
- Edit title/summary/why now.
- Save with button.
- Save with Ctrl/Cmd+S.
- Close with Escape.
- Open again and confirm state persists.
- Browser back closes detail before leaving app state.
- Archived idea shows permanent delete; non-archived shows archive.
- AI panel only acts on currently selected idea.
- File upload guard still blocks empty filename.

## Phase 4 acceptance gate

- Detail model/keyboard/layout tests pass.
- Full quality gate passes.
- Browser detail dogfood passes at 1280px.
- Codex read-only review: selected idea boundary, no hidden multi-idea AI behavior, no reintroduced rejected layout.

**Suggested commit:**

```bash
git add src/detailViewModel.ts src/detailViewModel.test.ts src/detailKeyboard.test.ts src/App.tsx src/App.css src/polishedInteractions.test.ts src/workbenchProductModel.ts src/workbenchProductModelI18n.test.ts server/ai-completions-contract.test.ts
git commit -m "feat(detail): mature spatial detail workflow"
```

---

# Phase 5 — Local-first reliability, deployment, and docs

## Objective

Make the system reliable to run on a local machine and personal VPS: backup/export, import/restore basics, sync-state semantics, Docker permissions, operator docs, and handoff documentation.

## Product outcome

A user can:

- run local dev container with hot reload
- run production compose with required secrets
- know where SQLite and files live
- export a backup without secrets
- restore/import a backup into a fresh local environment
- understand agent token exposure and reverse proxy boundaries
- diagnose health/settings/agent routes

## TDD tasks

### Task 5.1 — Make sync status meaningful

**Owner:** Hermes RED, OpenCode implementation.

**Files:**

- Modify: `src/store/useIdeaStoreSync.test.ts`
- Modify: `src/store/useIdeaStore.ts`
- Modify: `src/App.tsx`
- Modify: `src/i18n/messages.ts`

**RED test expectations:**

- Store tracks:
  - `syncState: idle | queued | syncing | synced | failed`
  - `lastSyncedAt`
  - `lastSyncError`
- Local edits mark state queued.
- Successful server write marks synced and sets timestamp.
- Failed server write marks failed with semantic message key.
- Topbar status slot remains stable and does not push layout.

### Task 5.2 — Export and restore contract

**Owner:** Codex backend.

**Files:**

- Create: `server/export-restore.test.ts`
- Create: `server/export.ts`
- Modify: `server/index.ts`
- Modify: `server/db.ts`

**RED test expectations:**

- `POST /api/export` or `/api/settings/backup` produces JSON with:
  - schemaVersion
  - exportedAt
  - ideas
  - ideaEvents
  - aiCompletions metadata/output
  - files metadata
  - settings summary without raw secrets
- `POST /api/import` in a fresh DB restores ideas/events/settings summary safely.
- Import rejects incompatible schema with clear error.
- Import does not overwrite existing DB unless explicit `mode: "replace"` is provided.

### Task 5.3 — Docker permissions and healthcheck

**Owner:** OpenCode/DevOps.

**Files:**

- Modify: `docker-compose.yml`
- Modify: `docker-compose.dev.yml`
- Modify: `Dockerfile`
- Modify: `server/deployment-config.test.ts`
- Modify: `server/operator-docs.test.ts`

**RED test expectations:**

- Compose documents or configures UID/GID behavior for `./data` volume.
- Production compose has healthcheck for `/api/health`.
- Production compose requires strong secrets and does not silently accept `change-me`.
- Dev compose keeps hot reload and persistent `/data`.

Runtime smoke:

```bash
IDEA_POOL_PORT=4180 \
IDEA_POOL_PASSWORD='local-qa-pass' \
IDEA_POOL_TOKEN='local-qa-token' \
IDEA_POOL_SESSION_SECRET='local-qa-session-secret' \
docker compose -f docker-compose.yml up -d --build --force-recreate idea-workbench
curl -fsS http://127.0.0.1:4180/api/health
```

Clean up after smoke.

### Task 5.4 — Operator guide

**Owner:** OpenCode docs, Hermes review.

**Files:**

- Create: `docs/operator-guide.md`
- Modify: `server/operator-docs.test.ts`
- Modify: `docs/agent-api.md`

**RED test expectations:**

Docs include:

- local dev commands
- production compose commands
- required env vars
- auth modes
- agent token use
- data directory and file storage layout
- backup/export/import commands
- VPS reverse proxy notes
- healthcheck endpoints
- disaster recovery basics

### Task 5.5 — Final product model docs and execution handoff

**Owner:** Hermes controller.

**Files:**

- Create or update: `docs/product-model.md`
- Create or update: `docs/plans/2026-05-30-five-phase-product-mainline.md`
- Modify: `README.md` if present and appropriate

**RED/docs checks:**

- Product model doc states:
  - Local-first Kanban
  - Spatial Detail View
  - AI selected idea only
  - single-user/private deployment
  - agent API boundary
- No stale docs claim permanent three-column board as main view.
- No docs expose real secrets.

## Phase 5 acceptance gate

- Full quality gate passes.
- Docker dev smoke passes.
- Production compose smoke passes on non-default port.
- Browser smoke passes:
  - Settings
  - detail open/close/back
  - sync status after edit/save
  - export/backup UI if surfaced
- Docs tests pass.
- Codex read-only review: deployment/auth/backup docs and export secret safety.

**Suggested commit:**

```bash
git add src/store/useIdeaStoreSync.test.ts src/store/useIdeaStore.ts src/App.tsx src/i18n/messages.ts server/export-restore.test.ts server/export.ts server/index.ts server/db.ts docker-compose.yml docker-compose.dev.yml Dockerfile server/deployment-config.test.ts server/operator-docs.test.ts docs/operator-guide.md docs/agent-api.md docs/product-model.md docs/plans/2026-05-30-five-phase-product-mainline.md
git commit -m "feat(ops): add local-first backup and deployment reliability"
```

---

# Execution schedule and commit strategy

## Recommended sequence

1. Phase 1 — Settings v2
2. Phase 2 — Agent API v1 hardening
3. Phase 3 — Data model and event log
4. Phase 4 — Detail View v2
5. Phase 5 — Local-first reliability/deployment/docs

Do not parallelize phases that touch the same core files unless using isolated worktrees and a deliberate merge plan. In this repo, the following files are high-conflict and should usually be changed by only one active implementer at a time:

- `src/App.tsx`
- `src/App.css`
- `src/i18n/messages.ts`
- `server/index.ts`
- `server/db.ts`
- `server/types.ts`

## Suggested commit cadence

- One commit per completed phase.
- Optional additional commit inside a phase only if it forms a clean, fully verified vertical slice.
- Commit messages:
  - `feat(settings): add schema secrets and backup controls`
  - `feat(agent): harden v1 contract and file handoff`
  - `feat(data): add evented idea history and completion audit`
  - `feat(detail): mature spatial detail workflow`
  - `feat(ops): add local-first backup and deployment reliability`

## Final completion criteria for all five phases

All of these must be true before declaring the five-phase plan complete:

- All phase commits exist locally.
- `npm test` passes.
- `npm run lint` passes.
- `npm run build` passes.
- `npm run build:server` passes.
- Docker dev smoke passes.
- Production compose smoke passes.
- Browser smoke passes at 1280px.
- Agent API smoke passes with Bearer token.
- Settings secret behavior passes in browser/API.
- Backup/export excludes raw secrets.
- Docs reflect current routes and product model.
- `sketches/016-settings-console-mockup/index_2.html` remains untracked unless the user explicitly requests committing it.

## Final report template

When all five phases are complete, report:

1. OpenCode/Codex task split actually used.
2. Phase-by-phase TDD RED/GREEN evidence.
3. Commit list.
4. File list by phase.
5. Full quality gate output.
6. Docker dev/prod smoke output.
7. Browser verification notes.
8. Agent API smoke output.
9. Remaining risks and next backlog.
10. Whether changes were pushed or are waiting for confirmation.
