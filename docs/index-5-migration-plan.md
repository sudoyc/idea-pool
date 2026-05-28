# Index 5 Migration Plan

## Goal

Migrate `sketches/012-personal-llm-workbench/index_5.html` into the production React app as **Personal Idea Workbench**.

The target product model is:

```text
Local-first Kanban + Spatial Detail View + AI Augmentation
```

The implementation should preserve the prototype's visual truth:

- Dark geek workspace with `--bg: #030305`, `--surface`, and `--accent: #c084fc`.
- Frosted sidebar/topbar via `backdrop-filter`.
- Kanban cards with `user-select: none` and native-app drag feel.
- Detail view opens as a spatial overlay while the board scales to `scale(0.96)` and dims.
- AI block keeps the shimmer border effect.
- LLM only completes selected ideas; it does not choose, move, or delete ideas.

## Phase 1: React Visual Migration

Replace the current dashboard-like app with the `index_5.html` workbench shell.

Scope:

- `src/App.tsx`
- `src/App.css`
- `src/index.css`
- component files under `src/components/`

Acceptance:

- Main Kanban view renders with sidebar, topbar, columns, and cards.
- Clicking a card opens the detail overlay.
- Workspace scales/dims behind the overlay.
- Back closes the overlay.
- AI block can simulate enrichment.

## Phase 2: Local-First State, Dragging, Icons

Add lightweight production structure:

- Zustand for global idea state.
- dnd-kit for moving cards between columns.
- Lucide React for icons.
- localStorage persistence.

Acceptance:

- Ideas persist after reload.
- Cards can move between Kanban columns.
- Editing detail fields updates local state.
- New Seed creates an editable inbox idea.

## Phase 3: Lightweight Backend

Add a small single-user API layer:

- Express API server.
- SQLite persistence.
- Bearer token middleware.
- No registration, accounts, teams, or sessions.

Environment:

```text
IDEA_POOL_TOKEN=...
LLM_API_KEY=...
DATABASE_URL=/data/idea-pool.db
```

Core API:

```text
GET    /api/health
GET    /api/ideas
POST   /api/ideas
PATCH  /api/ideas/:id
DELETE /api/ideas/:id
POST   /api/ideas/:id/complete
```

## Phase 4: LLM Completion

Replace the mock AI action with a real completion endpoint.

LLM responsibilities:

- Complete MVP boundary.
- Identify risks.
- Suggest first actions.
- Write boundary notes.

LLM must not:

- Select ideas automatically.
- Move cards automatically.
- Delete ideas.
- Override user notes without confirmation.

Completion response shape:

```ts
type AiAnalysis = {
  mvpSuggestion: string
  risks: string[]
  firstActions: string[]
  boundaryNotes: string
}
```

## Phase 5: Docker / VPS Deployment

Add deployment files for a private VPS install:

- `Dockerfile`
- `docker-compose.yml`
- `.dockerignore`
- `.env.example`

Deployment shape:

```text
single container
  serves built React files
  exposes API
  stores SQLite in /data
```

## Verification

For every major phase:

```bash
npm test
npm run lint
npm run build
```

For browser sanity:

- Open the app in Chromium.
- Check the board at ~1280px.
- Open/close detail overlay.
- Run AI completion mock/API path.
- Confirm no obvious horizontal overflow.
