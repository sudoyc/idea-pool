# Personal Idea Workbench

Personal Idea Workbench is a Local-first Kanban + Spatial Detail View + AI Augmentation workspace for capturing, shaping, and completing project ideas.

## Local Development

```bash
npm install
npm run dev
```

Docker dev keeps hot reload enabled and disables auth by default:

```bash
docker compose -f docker-compose.dev.yml up --build
```

## Quality Gate

Run the full local gate before shipping changes:

```bash
npm test
npm run lint
npm run build
npm run build:server
```

## Production Docker

Production compose enables auth and requires secrets from the environment:

```bash
export IDEA_POOL_PASSWORD=replace-with-a-strong-password
export IDEA_POOL_TOKEN=replace-with-a-long-random-token
export IDEA_POOL_SESSION_SECRET=replace-with-a-long-random-secret
docker compose up --build -d
```

Auth and storage environment variables:

- `IDEA_POOL_AUTH_ENABLED`
- `IDEA_POOL_PASSWORD`
- `IDEA_POOL_TOKEN`
- `IDEA_POOL_SESSION_SECRET`
- `IDEA_POOL_DATA_DIR`
- `DATABASE_URL`
- `LLM_API_KEY`
- `LLM_BASE_URL`
- `LLM_MODEL`

Session auth endpoints:

- `/api/auth/login`
- `/api/auth/logout`
- `/api/auth/session`

Versioned agent API endpoints:

- `/api/agent/v1/context`
- `/api/agent/v1/schema`
- `/api/agent/v1/ideas`
- `/api/agent/v1/ideas/:id/events`
- `/api/agent/v1/ideas/:id/complete`
- `/api/agent/v1/ideas/:id/agent-pack`
- `/api/agent/v1/ideas/:id/files`

## Main Paths

- `docs/idea-pool.md`: idea pool source material
- `docs/product-brief.md`: product brief
- `docs/implementation-plan.md`: implementation plan
- `src/data/seedIdeas.ts`: seed idea data
- `server/`: API, persistence, auth, and agent endpoints
