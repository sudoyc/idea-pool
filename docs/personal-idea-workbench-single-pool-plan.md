# Personal Idea Workbench Single-Pool Workspace Implementation Plan

> **For Hermes:** Use subagent-driven-development skill principles, but coordinate this specific change with OpenCode for implementation and Codex for review. Controller writes RED tests first, verifies RED, delegates GREEN implementation to OpenCode, then asks Codex for read-only structural review before final verification.

**Goal:** Replace the current three-column workspace/inspector rail with the approved `015-lens-grid-pool` model: a single idea-pool card grid whose visible contents are controlled by the framed sidebar lens area, with status classification targets appearing from the right only while dragging.

**Architecture:** Keep the existing React/Vite/Zustand/dnd-kit stack and preserve the existing app shell, auth/settings/backend, local-first sync, and bottom-up detail view. The data model can continue using the existing `IdeaStatus` values (`INBOX`, `PIPELINE`, `TRASH`), but the main workspace must not represent these as permanent columns. Sidebar controls select lenses over the pool; drag classification targets map to `PIPELINE` and `TRASH`.

**Tech Stack:** React + Vite + TypeScript, Zustand, dnd-kit, Vitest source/pure-function tests, existing CSS tokens.

---

## Hard Boundaries

- Preserve the original app shell: left sidebar, topbar, settings/auth flow, dark/purple developer-tool visual language.
- Preserve the detail view as a bottom-up spatial layer. Do not turn it into a right drawer or separate page.
- Do not change backend API/schema in this phase.
- Do not reintroduce the 340px right inspector rail.
- Do not show three permanent status columns in the main workspace.
- AI still acts only on the selected idea inside detail.
- TDD is mandatory: tests first, observe RED, then implement.

## OpenCode / Codex Split

### OpenCode implementation scope

OpenCode owns the production frontend/product-model implementation after RED tests exist:

- `src/workbenchProductModel.ts`
- `src/workbenchTypes.ts`
- `src/store/useIdeaStore.ts`
- `src/App.tsx`
- `src/App.css`
- any new/updated frontend Vitest files

OpenCode must not modify backend files, Docker files, or docs except if asked to fix test wording in the plan.

### Codex review scope

Codex is used after OpenCode implementation for read-only review:

- Check whether implementation matches this plan and the approved `015-lens-grid-pool` model.
- Check that detail remains bottom-up.
- Check that dnd-kit drag overlay remains portal-based.
- Check tests are meaningful and not just brittle snapshots.
- Recommend fixes, but do not modify files unless explicitly delegated after review.

## Target UX Contract

### Main workspace

- Main workspace is a single idea pool, visually similar to `sketches/015-lens-grid-pool/index.html`.
- Cards appear in a responsive grid using existing card visual language.
- Status appears as metadata on each card, not as a column grouping.
- Topbar title should describe the selected lens, not a column.

### Sidebar framed area

Replace the current status-as-board navigation semantics with pool lenses:

- `All ideas` -> shows all ideas.
- `Unsorted pool` -> shows `INBOX` ideas.
- `Active work` -> shows `PIPELINE` ideas.
- `Parked` -> shows `TRASH` ideas.

The framed/sidebar area is allowed to show counts and to update the main view. It must not imply the main workspace is three columns.

### Drag classification

- Dragging a card should add a global class or equivalent state so right-side classification targets animate in.
- Two targets should appear from the right while dragging:
  - `Active work` -> sets status to `PIPELINE`.
  - `Parked / archive` -> sets status to `TRASH`.
- Dropping over another card in the pool may reorder without changing status.
- Dropping outside targets/cards should leave the idea unchanged.
- Existing drag overlay portal behavior must be preserved.

### Detail view

- Click/tap card opens the existing detail view from below.
- `.detail-view` should remain bottom-up (`translateY(100%)` closed, `translateY(0)` open).
- The detail content/rail can remain as currently implemented.

---

## Task 1: Product model contracts for pool lenses and drag targets

**Objective:** Add test contracts that describe the new workspace model before production code changes.

**Files:**
- Modify: `src/workbenchProductModel.ts`
- Test: `src/workbenchProductModelPool.test.ts`

**Step 1: Write failing test**

Test expectations:

- `ideaPoolLenses` ids equal `['ALL', 'INBOX', 'PIPELINE', 'TRASH']`.
- Lens copy includes `All ideas`, `Unsorted pool`, `Active work`, `Parked`.
- `dragClassificationTargets` statuses equal `['PIPELINE', 'TRASH']`.
- Drag target labels include `Active work` and `Parked / archive`.
- The product model text explicitly says status is metadata and classification happens on drag, not as permanent columns.

**Step 2: Run test to verify failure**

Run:

```bash
npm test -- src/workbenchProductModelPool.test.ts
```

Expected: FAIL because `ideaPoolLenses` and `dragClassificationTargets` do not exist yet.

**Step 3: Implement minimal production code**

Add exported model constants/types in `src/workbenchProductModel.ts`. Do not change backend.

**Step 4: Run test to verify pass**

Run:

```bash
npm test -- src/workbenchProductModelPool.test.ts src/workbenchProductModel.test.ts src/workbenchProductModelPhase2.test.ts
```

Expected: PASS.

---

## Task 2: Store lens state and pool filtering contract

**Objective:** Store current pool lens separately from card status and provide a deterministic filtering helper.

**Files:**
- Modify: `src/workbenchTypes.ts`
- Modify: `src/store/useIdeaStore.ts`
- Test: `src/store/useIdeaStorePool.test.ts`

**Step 1: Write failing test**

Test expectations:

- Store initializes with `activeLens: 'ALL'`.
- `setIdeaPoolLens('PIPELINE')` updates `activeLens` and keeps `screen: 'WORKBENCH'`.
- `getVisibleIdeasForLens(ideas, 'ALL')` returns all ideas.
- `getVisibleIdeasForLens(ideas, 'INBOX')` returns only `INBOX` ideas.
- `moveIdea(id, 'TRASH')` changes status but does not open detail.

**Step 2: Run test to verify failure**

Run:

```bash
npm test -- src/store/useIdeaStorePool.test.ts
```

Expected: FAIL because the store currently has `activeFilter` only and no pool lens helper.

**Step 3: Implement minimal production code**

- Add `IdeaPoolLens = 'ALL' | IdeaStatus` in `src/workbenchTypes.ts`.
- Add `activeLens` and `setIdeaPoolLens` in `src/store/useIdeaStore.ts`.
- Preserve `moveIdea` and sync behavior.
- Either replace `activeFilter` or keep a backwards-compatible alias only if needed for existing tests; new UI should use `activeLens`.

**Step 4: Run test to verify pass**

Run:

```bash
npm test -- src/store/useIdeaStorePool.test.ts src/store/useIdeaStoreSync.test.ts
```

Expected: PASS.

---

## Task 3: App source contract for single pool and drag classification targets

**Objective:** Prevent regression to permanent columns/right rail while preserving bottom-up detail and drag overlay portal.

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/App.css`
- Test: `src/workspaceSinglePoolLayout.test.ts`

**Step 1: Write failing test**

Test expectations from raw source/CSS:

- `App.tsx` renders `IdeaPool` and `DragClassificationTargets`.
- `App.tsx` no longer renders `<BoardColumn` or `<InspectorRail` in the workbench path.
- `App.tsx` still uses `createPortal(... document.body ...)` around `DragOverlay`.
- `App.css` defines `.idea-pool` with `repeat(auto-fill, minmax(...))`.
- `App.css` defines `.drag-classification-targets` and a visible dragging state.
- `App.css` does not keep `.workspace-layout` as `minmax(0, 1fr) 340px`.
- `App.css` keeps `.detail-view` bottom-up via `translateY(100%)`.

**Step 2: Run test to verify failure**

Run:

```bash
npm test -- src/workspaceSinglePoolLayout.test.ts src/dndOverlayPlacement.test.ts server/app-dnd-css.test.ts
```

Expected: FAIL because current code still has BoardColumn/InspectorRail and no `.idea-pool`/classification target styles.

**Step 3: OpenCode implementation**

Delegate to OpenCode with this plan and failing tests:

- Replace board columns with an `IdeaPool` component.
- Use `SortableContext` over visible idea ids.
- Keep existing `IdeaCard` component but include status metadata and grid-friendly layout.
- Add `DragClassificationTargets` with two `useDroppable` targets for `PIPELINE` and `TRASH`.
- In `handleDragEnd`, if `over.id` is a classification target, call `moveIdea(activeId, target.status)`.
- If `over.id` is another idea id, reorder within current pool without changing status.
- Preserve drag overlay portal.
- Remove/stop rendering `InspectorRail`.
- Update sidebar nav to lens copy/counts and call `setIdeaPoolLens`.
- Preserve Settings and DetailView behavior.

**Step 4: Run targeted tests**

Run:

```bash
npm test -- src/workspaceSinglePoolLayout.test.ts src/workbenchProductModelPool.test.ts src/store/useIdeaStorePool.test.ts src/dndOverlayPlacement.test.ts server/app-dnd-css.test.ts
```

Expected: PASS.

---

## Task 4: Codex review and fixes

**Objective:** Use Codex as a read-only reviewer before final verification.

**Files:**
- Review only unless follow-up fixes are explicitly delegated.

**Codex command:**

```bash
codex exec "Review the Personal Idea Workbench single-pool workspace implementation. Check it against docs/personal-idea-workbench-single-pool-plan.md and sketch 015-lens-grid-pool. Do not modify files. Report spec gaps, test gaps, and regression risks."
```

Expected review focus:

- No permanent three-column workspace remains.
- Detail remains bottom-up.
- Drag classification targets appear only while dragging.
- Existing backend/auth/settings/file features are not touched.
- Tests prove the behavior meaningfully.

If Codex finds must-fix issues, patch or re-delegate a narrow OpenCode fix with tests first.

---

## Task 5: Full verification

**Objective:** Prove the implementation works and did not regress the product.

**Commands:**

```bash
npm test
npm run lint
npm run build
npm run build:server
```

**Browser verification:**

Use the running dev stack or start it if needed.

Verify at desktop 1280px:

- Workbench shows one idea pool, not three status columns.
- Sidebar lens buttons change visible cards and counts.
- Dragging a card causes two right-side classification windows to appear.
- Dropping to Active work changes status to `PIPELINE`.
- Dropping to Parked changes status to `TRASH`.
- Clicking a card opens the existing bottom-up detail view.
- Escape/Back closes detail.
- Settings still opens.
- Console has no JS errors.

**Final report must include:**

1. OpenCode/Codex split actually used.
2. Current implementation plan path.
3. TDD RED/GREEN evidence.
4. Modified files.
5. Verification output.
6. Remaining risks and next steps.
