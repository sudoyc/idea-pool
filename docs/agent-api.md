# Personal Idea Workbench Agent API

Personal Idea Workbench exposes a versioned agent API for the Local-first Kanban + Spatial Detail View + AI Augmentation workflow.

Use bearer authentication on every `/api/agent/v1` request:

```sh
Authorization: Bearer $IDEA_POOL_TOKEN
```

## Context And Schema

- `GET /api/agent/v1/context` returns workspace context, API version, rules, and capabilities.
- `GET /api/agent/v1/schema` returns valid idea statuses, sources, and file kinds.
- `GET /api/agent/v1/settings` returns the current workspace settings summary with `writable: false`.

## Ideas And Events

- `GET /api/agent/v1/ideas` lists ideas.
- `POST /api/agent/v1/ideas` creates an agent-sourced idea.
- `PATCH /api/agent/v1/ideas/:id` updates an idea.
- `POST /api/agent/v1/ideas/:id/events` records an agent event for an idea.
- `POST /api/agent/v1/ideas/:id/complete` runs completion and stores the AI completion record.
- `POST /api/agent/v1/ideas/:id/agent-pack` generates a markdown handoff file for an idea.

## Files

- `GET /api/agent/v1/ideas/:id/files` lists file metadata for an idea.
- `POST /api/agent/v1/ideas/:id/files/content` uploads safe text content and creates file metadata.
- `GET /api/agent/v1/files/:id/download` downloads stored file content.
- `DELETE /api/agent/v1/files/:id` deletes stored file content and metadata.

Filenames must be plain basenames such as `brief.md`; path traversal names such as `../brief.md` are rejected.

```sh
curl -H "Authorization: Bearer $IDEA_POOL_TOKEN" \
  http://127.0.0.1:3000/api/agent/v1/context
```
