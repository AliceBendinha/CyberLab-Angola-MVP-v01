---
name: Prisma seed entrypoint
description: Avoid deprecated Prisma package metadata for the API package's seed command.
---

Run the API package's idempotent seed through its direct `tsx` script rather than configuring it with `package.json#prisma`.

**Why:** Prisma 6.19.3 emitted a deprecation warning for the package-level Prisma configuration while the API migration was being created.

**How to apply:** Keep the seed command owned by `artifacts/api-server` and invoke it through that package's script. Reassess only when the project changes its Prisma version or seed tooling.
