---
name: Replit runtime environment labels
description: Distinguishes shell environment labels from the actual development database target.
---

In this workspace, the shell reported `REPLIT_ENVIRONMENT=production` while `NODE_ENV` was not production and the configured database was the development database.

**Why:** Treating that label as authoritative falsely blocked isolated development-schema tests.

**How to apply:** Do not infer the active database from `REPLIT_ENVIRONMENT` alone. Check explicit deployment markers and verify the development database context without printing credentials.
