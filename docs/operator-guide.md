# Personal Idea Workbench Operator Guide

Personal Idea Workbench is a single-user workbench built around:

- Local-first Kanban + Spatial Detail View + AI Augmentation
- session-authenticated browser control plane
- optional bearer-token agent access behind a reverse proxy or private network boundary

## Local development

```sh
npm install
npm run dev
npm run dev:server
```

Docker dev with hot reload:

```sh
docker compose -f docker-compose.dev.yml up --build
```

## Production

```sh
docker compose up --build -d
```

Required environment variables:

- `IDEA_POOL_AUTH_ENABLED`
- `IDEA_POOL_PASSWORD`
- `IDEA_POOL_TOKEN`
- `IDEA_POOL_SESSION_SECRET`
- `IDEA_POOL_DATA_DIR`
- `DATABASE_URL`

Optional model/runtime variables:

- `LLM_API_KEY`
- `LLM_MODEL`
- `EMBEDDING_MODEL`
- `PORT`

## Runtime layout

- SQLite DB: `DATABASE_URL`
- file storage root: `IDEA_POOL_DATA_DIR/files`
- exported backups are written under `IDEA_POOL_DATA_DIR/files/exports`
- the app is intentionally single-user and should be exposed through a reverse proxy only when you understand the auth boundary

## Health and control plane checks

- `GET /api/health`
- `GET /api/auth/session`
- `GET /api/settings`
- `POST /api/settings/backup`
- `POST /api/settings/import`
- `GET /api/agent/v1/context`

## Backup and import boundaries

`POST /api/settings/backup` creates a JSON manifest for disaster recovery and migration.

Boundaries:

- raw secrets are never exported
- the manifest contains masked settings only
- attached files are represented as file metadata only
- stored bytes are not embedded in the manifest
- import/restore lives on the session-authenticated settings control plane, not the bearer-token agent surface
- the default import is non-destructive and blocks if live local data already exists
- to overwrite an existing local workspace you must re-run with `mode: "replace"`

Restored settings keys:

- `workspaceName`
- `llmModel`
- `embeddingModel`
- `agentExposure`

Skipped settings keys:

- `schemaVersion`
- `storagePath`
- `agentBasePath`
- `llmApiKeyConfigured`
- `llmApiKeyMasked`

## Disaster recovery

Recommended disaster recovery flow:

1. Confirm the current host and `IDEA_POOL_DATA_DIR`.
2. Trigger a fresh backup from `/api/settings/backup`.
3. Move the manifest to the new machine.
4. Start a fresh Personal Idea Workbench instance.
5. Log in through the normal browser control plane.
6. Import the manifest through `/api/settings/import`.
7. If the target already contains live local data, review it first; only use replace mode when you intentionally want to wipe and restore.
8. Rebuild any missing attachment bytes separately, because backups currently restore metadata, not stored file contents.

This guide is for a private, personal deployment model rather than a multi-tenant SaaS setup.
