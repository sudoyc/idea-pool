# Personal Idea Workbench Agent API

Personal Idea Workbench exposes a versioned agent API for the Local-first Kanban + Spatial Detail View + AI Augmentation workflow.

This API is designed for a single-user/private deployment. The bearer-token surface is intentionally narrower than the browser control plane.

Use bearer authentication on every `/api/agent/v1` request:

```sh
Authorization: Bearer ***
```

The backup/import flow stays on the session-authenticated settings control plane.

## Context And Schema

- `GET /api/agent/v1/context` returns workspace context, API version, rules, and capabilities.
- `GET /api/agent/v1/schema` returns valid idea statuses, sources, and file kinds.
- `GET /api/agent/v1/settings` returns the current workspace settings summary with `writable: false`.

## Ideas And Events

- `GET /api/agent/v1/ideas` lists ideas.
- `POST /api/agent/v1/ideas` creates an agent-sourced idea.
- `PATCH /api/agent/v1/ideas/:id` updates one explicit idea.
- `POST /api/agent/v1/ideas/:id/events` records a typed event for one explicit idea.
- `POST /api/agent/v1/ideas/:id/complete` runs completion for the selected idea only and stores the AI completion record.
- `POST /api/agent/v1/ideas/:id/agent-pack` generates a markdown handoff file for an idea.

Agent routes never return raw API secrets. `GET /api/agent/v1/settings` is read-only (`writable: false`).

## Files

- `GET /api/agent/v1/ideas/:id/files` lists file metadata for an idea.
- `POST /api/agent/v1/ideas/:id/files/content` uploads safe text content and creates file metadata.
- `GET /api/agent/v1/files/:id/download` downloads stored file content.
- `DELETE /api/agent/v1/files/:id` deletes stored file content and metadata.

Filenames must be plain basenames such as `brief.md`; path traversal names such as `../brief.md` are rejected.

## Example

```sh
curl -H "Authorization: Bearer ***" \
  http://127.0.0.1:3000/api/agent/v1/context
```
