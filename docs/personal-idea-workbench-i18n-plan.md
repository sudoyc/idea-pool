# Personal Idea Workbench i18n Implementation Plan

> **For Hermes:** Use test-driven-development strictly. Controller writes RED tests first, verifies RED, delegates GREEN implementation to OpenCode, then asks Codex for read-only review before final verification.

**Goal:** Introduce a maintainable bilingual i18n system for the current Personal Idea Workbench frontend so the UI can switch between Chinese and English without scattering hardcoded copy across components.

**Architecture:** Keep the existing React + Vite + TypeScript stack and preserve the approved single-pool workspace + bottom-up detail interaction. Add a lightweight in-repo i18n layer (`zh` / `en`) with a typed translation catalog, a locale provider/hook, and locale-persistent UI state. Product-model copy, screen copy, status labels, auth copy, settings copy, and seed/default idea copy should resolve through i18n instead of hardcoded strings.

**Tech Stack:** React context/hooks, TypeScript, Zustand (only if needed for locale persistence), Vitest source/pure-function tests, existing CSS tokens.

---

## Hard Boundaries

- Preserve the approved single-pool workspace model.
- Preserve the bottom-up detail view interaction.
- Do not redesign layout while adding i18n.
- Do not change backend API/schema in this phase unless a frontend contract absolutely requires it.
- Copy changes must flow through i18n instead of direct JSX/string edits.
- Terms like `AI`, `token`, `Agent API`, `WORKSPACE`, and other genuinely product/technical terms may remain English or mixed where that is clearer.
- TDD is mandatory: RED first, then GREEN, then REFACTOR.

## OpenCode / Codex Split

### OpenCode implementation scope

OpenCode owns production implementation after RED tests exist:

- `src/main.tsx`
- `src/App.tsx`
- `src/store/useIdeaStore.ts`
- `src/data/workbenchIdeas.ts`
- `src/workbenchProductModel.ts`
- `src/workbenchTypes.ts`
- new i18n files under `src/i18n/`
- relevant Vitest files under `src/`

OpenCode should not modify backend files in this slice.

### Codex review scope

Codex is used afterward for read-only review:

- verify i18n architecture is centralized instead of ad-hoc
- verify locale switching does not regress the single-pool workspace
- verify bottom-up detail remains intact
- verify copy is no longer scattered in JSX/product-model constants/store status messages
- verify tests check both locales and locale persistence

## Target UX Contract

### Locale behavior

- Supported locales: `zh` and `en`
- Default locale: `zh`
- Locale persists locally across reloads
- User can switch locale in a visible UI affordance
- Switching locale updates current screen immediately without reload

### Scope of first-pass translation coverage

Must cover the current product mainline screens:

- sidebar
- topbar
- pool lens labels and descriptions
- drag classification targets
- card metadata/status labels
- detail actions / section titles / AI block copy / file panel copy
- settings page titles, summaries, control labels, session text
- login / loading screen copy
- UI status messages from store (`New seed created`, `Moved to ...`, sync statuses, etc.)
- starter seed idea content and default AI analysis guidance used for fresh local state

### Acceptable English exceptions

The catalog may intentionally keep or partially keep terms such as:

- AI
- token
- Agent API
- Markdown
- MVP
- WORKSPACE / Workbench (if used as product/brand term)

The system still must route them through i18n keys, even if the value is identical between locales.

## Implementation Shape

### i18n infrastructure

Add a small typed i18n layer under `src/i18n/`:

- locale type: `zh | en`
- translation catalog for both locales
- translator function like `t(key)`
- locale persistence helper / provider / hook

Prefer a simple local solution over a heavy dependency.

### Product model refactor

Current `src/workbenchProductModel.ts` hardcodes English copy. Refactor it so product model data is produced from i18n, for example through builder functions that accept `t`, or translation-key-based models.

### Workbench/store refactor

Current store hardcodes status messages and default analysis copy. Replace these with locale-aware factories or semantic message keys so UI strings are not embedded directly in the store logic.

### Seed data refactor

Current `src/data/workbenchIdeas.ts` exports static Chinese seed ideas. Refactor to export a locale-aware builder for initial seed content so fresh local state respects the active/default locale.

---

## Task 1: Add pure i18n catalog contract tests

**Objective:** Define the bilingual catalog contract before adding production i18n files.

**Files:**
- Create: `src/i18n/messages.test.ts`
- Create: `src/i18n/messages.ts`
- Create: `src/i18n/types.ts`

**Step 1: Write failing test**

Test expectations:

- supported locales equal `['zh', 'en']`
- both locales expose keys for:
  - sidebar / settings / auth / detail / sync statuses
  - pool lenses
  - drag targets
  - store status messages
- `zh` and `en` translations differ for ordinary UI copy such as `settings`, `allIdeas`, `saveChanges`
- technical terms like `AI` may legitimately stay the same across locales

**Step 2: Run test to verify failure**

```bash
npm test -- src/i18n/messages.test.ts
```

Expected: FAIL because the i18n module does not exist yet.

**Step 3: Implement minimal production code**

Add typed locale definitions and a translation catalog.

**Step 4: Run test to verify pass**

```bash
npm test -- src/i18n/messages.test.ts
```

## Task 2: Add locale persistence/provider contract tests

**Objective:** Prove the app can resolve a default locale and persist user choice.

**Files:**
- Create: `src/i18n/localeStore.test.ts`
- Create or modify: `src/i18n/localeStore.ts`
- Create or modify: `src/i18n/I18nProvider.tsx`

**Step 1: Write failing test**

Test expectations:

- default locale resolves to `zh`
- stored locale overrides default
- invalid stored locale falls back to `zh`
- changing locale persists it under a stable storage key

**Step 2: Run test to verify failure**

```bash
npm test -- src/i18n/localeStore.test.ts
```

Expected: FAIL because persistence/provider helpers do not exist yet.

**Step 3: Implement minimal production code**

Add a small locale store/helper and provider/hook.

**Step 4: Run test to verify pass**

```bash
npm test -- src/i18n/localeStore.test.ts
```

## Task 3: Add product-model i18n contract tests

**Objective:** Ensure product-model copy no longer lives as hardcoded language-specific constants.

**Files:**
- Modify: `src/workbenchProductModel.ts`
- Modify/Create: `src/workbenchProductModel.test.ts`
- Modify/Create: `src/workbenchProductModelPool.test.ts`

**Step 1: Write failing test**

Test expectations:

- product model exposes locale-aware builders or translation-key based data
- pool lenses can be resolved in both `zh` and `en`
- settings sections can be resolved in both `zh` and `en`
- sync status labels can be resolved in both `zh` and `en`
- direct hardcoded English copy is no longer the primary source of UI text

**Step 2: Run test to verify failure**

```bash
npm test -- src/workbenchProductModel.test.ts src/workbenchProductModelPool.test.ts
```

Expected: FAIL because current product model exports hardcoded strings.

**Step 3: Implement minimal production code**

Refactor product-model exports to locale-aware builders.

**Step 4: Run test to verify pass**

```bash
npm test -- src/workbenchProductModel.test.ts src/workbenchProductModelPool.test.ts
```

## Task 4: Add seed/default-analysis i18n contract tests

**Objective:** Ensure fresh starter content and default AI guidance are locale-aware.

**Files:**
- Modify: `src/data/workbenchIdeas.ts`
- Modify: `src/store/useIdeaStore.ts`
- Modify: `src/workbenchTypes.test.ts`
- Modify: `src/workspaceSinglePoolLayout.test.ts`
- Create if needed: `src/data/workbenchIdeas.i18n.test.ts`

**Step 1: Write failing test**

Test expectations:

- initial seed content can be created for `zh` and `en`
- English starter content is not just the Chinese text reused verbatim
- default AI analysis guidance in the store is locale-aware
- no stale hardcoded old-language copy remains in the store/source contracts

**Step 2: Run test to verify failure**

```bash
npm test -- src/workbenchTypes.test.ts src/workspaceSinglePoolLayout.test.ts
```

Expected: FAIL because current seed/default guidance is hardcoded.

**Step 3: Implement minimal production code**

Refactor seed idea exports and default AI analysis builders to accept locale/default locale.

**Step 4: Run test to verify pass**

```bash
npm test -- src/workbenchTypes.test.ts src/workspaceSinglePoolLayout.test.ts
```

## Task 5: Add app-level i18n source contract tests

**Objective:** Ensure `App.tsx` consumes i18n instead of hardcoded UI strings.

**Files:**
- Modify or create: `src/appI18nIntegration.test.ts`
- Modify: `src/App.tsx`
- Modify: `src/main.tsx`

**Step 1: Write failing test**

Test expectations:

- `main.tsx` wraps the app in an i18n provider
- `App.tsx` consumes a `useI18n` or equivalent hook
- major UI strings like `Settings`, `Pool lenses`, `New Seed`, `Save Changes`, `Back`, `Upload Markdown` are no longer directly hardcoded in JSX
- there is a locale switch affordance rendered in the actual app shell or settings screen

**Step 2: Run test to verify failure**

```bash
npm test -- src/appI18nIntegration.test.ts
```

Expected: FAIL because the app currently hardcodes these strings.

**Step 3: Implement minimal production code**

Wire the provider into `main.tsx`, use i18n in `App.tsx`, and add a locale switcher.

**Step 4: Run test to verify pass**

```bash
npm test -- src/appI18nIntegration.test.ts
```

## Task 6: OpenCode implementation pass

**Objective:** Let OpenCode implement the GREEN phase once the RED tests exist.

**Files:**
- Modify only the planned frontend/i18n files.

**Implementation constraints for OpenCode:**

- Do not change backend files.
- Do not redesign layout.
- Keep bottom-up detail behavior intact.
- Keep single-pool workspace intact.
- Route UI copy through i18n.
- Run the targeted RED tests first, then make them pass.
- Run the full frontend/server quality gate after implementation.

## Task 7: Codex read-only review

**Objective:** Independent check that the i18n implementation is centralized and non-regressive.

**Review checklist:**

- locale provider/hook is simple and maintainable
- product-model copy moved behind i18n
- store status messages/default guidance no longer hardcoded in one language
- locale persistence works
- single-pool workspace and bottom-up detail behavior are preserved
- tests meaningfully cover both locales and locale switching

## Final verification

After GREEN and review fixes:

```bash
npm test
npm run lint
npm run build
npm run build:server
```

Browser verification on `http://127.0.0.1:5173/`:

- default locale is Chinese
- switch to English updates current screen immediately
- switch back to Chinese works
- sidebar / topbar / detail / settings / auth / drag targets all change language
- accepted technical terms remain readable
- detail still opens from below
- drag classification still works
- no console errors
- no horizontal overflow at 1280px

## Out of scope for this slice

- Full backend/API localization
- Multi-language user-generated idea content migration
- More than two locales
- Large visual redesign
- New lens density/sort controls unless needed to expose locale switching cleanly

## Recommended next step after this slice

After i18n lands cleanly, the next highest-value frontend slice is to add a compact control row for:

- locale switch
- density
- sort
- maybe tag lens

But do not combine that with this i18n slice unless the locale switch itself needs a small UI control area.
