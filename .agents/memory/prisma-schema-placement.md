---
name: Prisma schema placement
description: Prisma package resolution in this pnpm monorepo depends on keeping a schema within the package that owns its CLI and client.
---

Keep the Prisma schema inside the owning API artifact package. With Prisma 6 in this workspace, placing the schema at the repository root caused generation to resolve dependencies from the root context and attempt an automatic install there, even though the API package already declared Prisma and Prisma Client.

**Why:** The workspace root rejects package additions, and Prisma resolves generator dependencies relative to the schema's package context.

**How to apply:** Put future API Prisma schemas under `artifacts/api-server/prisma/` and run Prisma commands from the API package scripts.
