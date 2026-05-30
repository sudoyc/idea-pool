# Workbench Redesign Handoff

## Current situation

The repository contains a working implementation of `Personal Idea Workbench`, but the current page design direction is not accepted.

The product has functioning pieces:

- local-first idea state
- kanban interactions
- detail overlay
- AI completion stub / API path
- simple backend and SQLite
- session/token auth groundwork
- Docker dev/prod setup

But the current UI/UX should be treated as **intermediate**, not final.

## Main problem statement

The current design has serious layout problems.

Observed issues:

1. The right side composition is weak.
2. The layout feels assembled rather than designed.
3. Space usage is inefficient even after recent expansion.
4. The relationship between board, inspector, and detail still lacks clarity.
5. The product does not yet feel like a strong, long-term personal workspace.
6. Some recent additions improved function, but not enough visual conviction.

## What should remain true

Do not lose these product truths:

1. This is a personal, private, developer-facing tool.
2. It is local-first at heart.
3. Kanban remains relevant.
4. AI only enriches selected ideas.
5. The system should remain deployable on a personal VPS.
6. The tone should stay dark, focused, and non-marketing.

## Current technical assets worth preserving

Frontend:

- React
- Vite
- TypeScript
- Zustand
- dnd-kit
- Lucide React

Backend:

- Express
- SQLite via `better-sqlite3`
- session/token auth groundwork
- LLM completion groundwork

Infra:

- Dockerfile
- `docker-compose.yml`
- `docker-compose.dev.yml`

## Important current files

UI and state:

- `src/App.tsx`
- `src/App.css`
- `src/store/useIdeaStore.ts`
- `src/workbenchTypes.ts`
- `src/data/workbenchIdeas.ts`

Backend:

- `server/index.ts`
- `server/auth.ts`
- `server/db.ts`
- `server/types.ts`
- `server/llm.ts`

Planning/context:

- `docs/index-5-migration-plan.md`
- `sketches/012-personal-llm-workbench/index_5.html`

## Current auth behavior

Current auth behavior is intentionally lightweight:

- if no password/token is configured in dev, auth degrades to disabled
- if configured, UI login and API protection should apply
- production should not silently run with missing auth config

This groundwork should stay, even if the UI is redesigned heavily.

## Current commits of note

- `117f4d4 Implement personal idea workbench`
- `4eee826 Add hot reload Docker dev setup`
- `1014266 Improve workbench layout and navigation`
- `0005008 Add session auth and remote idea sync`

## Redesign expectation

The next person should not make only small CSS patches.

They should:

1. Re-evaluate the information architecture.
2. Decide whether the current board + inspector + overlay composition is fundamentally correct.
3. Potentially simplify or replace it.
4. Make the workspace feel deliberate and durable.
5. Preserve functional integration points.

## Suggested redesign questions

The next person should answer questions like:

1. Should the workspace be board-first, detail-first, or split-context?
2. Is the current inspector rail helping or hurting?
3. Should notes/checklists live in overlay, side rail, or persistent lower context?
4. How should Settings fit the product naturally?
5. What is the strongest way to make this feel like a real personal developer environment instead of a prototype?

## Verification expectations

Any redesign implementation should still verify:

```bash
npm test
npm run lint
npm run build
npm run build:server
```

And should be checked in browser via:

- local dev
- Docker dev if relevant
- at least one 1280px desktop check

## Final instruction to the next implementer

Be willing to rethink the page structure, not just decorate it.

Preserve the product model and the technical foundation, but do not assume the current screen composition is correct.
