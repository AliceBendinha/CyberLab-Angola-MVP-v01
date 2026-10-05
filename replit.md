# CyberLab Angola

Uma fundação web/PWA para uma proposta de aprendizagem prática em cibersegurança.

## Run & Operate

- `pnpm --filter @workspace/cyberlab-angola run dev` — frontend web/PWA
- `pnpm --filter @workspace/api-server run dev` — Express API
- `pnpm --filter @workspace/api-server run db:generate` — generate Prisma Client
- `pnpm --filter @workspace/api-server run db:validate` — validate Prisma schema
- `pnpm run typecheck` — typecheck libraries and workspace packages
- `pnpm run build` — typecheck and build workspace packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate typed API client and validators

## Stack

- pnpm workspaces, Node.js, TypeScript
- Frontend: React, Vite, Tailwind CSS, React Router, PWA
- API: Express 5, REST, OpenAPI
- DB: PostgreSQL + Prisma ORM
- API code generation: Orval + Zod
- Backend bundling: esbuild

## Where things live

- `artifacts/cyberlab-angola/` — React frontend and PWA
- `artifacts/api-server/` — Express API and future backend extension points
- `artifacts/api-server/prisma/schema.prisma` — Prisma schema associado ao serviço backend
- `lib/api-spec/openapi.yaml` — REST contract
- `docs/architecture.md` — architecture overview
- `README.md` — local setup and MVP scope

## Architecture decisions

- The Replit starter is a pnpm monorepo and its root preinstall rejects npm; retain pnpm and the existing workspace rather than introducing a second package lock.
- Frontend and API remain separate services; the API is routed under `/api`.
- Prisma is the selected ORM for CyberLab. The unused template Drizzle library is not connected to the API.
- The UI is intentionally a proposal, not a validated or operational learning product.

## Product

MVP v0.1 contains the landing page, visual-only login and registration, a dashboard placeholder, PWA setup, and the API health route. It contains no real auth, AI, mission, skills, talent discovery, or institutional dashboard functionality.

## User preferences

- Keep the initial scope limited to the foundation specification; do not add features from later prompts.
- Never present fictional INTELLICO data as real or imply product validation.
- Keep API keys and secrets on the backend, never in the frontend.

## Gotchas

- The API validates `DATABASE_URL` and connects via Prisma at startup.
- A root `.env` is read by the API; copy `.env.example` to `.env` for local development.
- API contract changes require `pnpm --filter @workspace/api-spec run codegen`.
- Replit service workflows supply `PORT` and `BASE_PATH`; local Vite defaults to port 5173.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
