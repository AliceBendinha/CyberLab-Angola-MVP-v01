import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const testSchema = "cyberlab_auth_test";
const testMode = process.argv[2] ?? "--auth";
const testFiles = {
  "--auth": ["src/tests/auth.integration.test.ts"],
  "--learning": ["src/tests/learning.integration.test.ts"],
  "--all": [
    "src/tests/auth.integration.test.ts",
    "src/tests/learning.integration.test.ts",
  ],
}[testMode];

if (!testFiles) {
  throw new Error("Choose --auth, --learning, or --all.");
}

if (
  process.env.NODE_ENV === "production" ||
  process.env.REPLIT_DEPLOYMENT
) {
  throw new Error("Authentication integration tests are blocked in production.");
}

const configuredUrl = process.env.DATABASE_URL;
if (!configuredUrl) {
  throw new Error("DATABASE_URL must be configured for isolated integration tests.");
}

let testDatabaseUrl;
try {
  const url = new URL(configuredUrl);
  url.searchParams.set("schema", testSchema);
  testDatabaseUrl = url.toString();
} catch {
  throw new Error("DATABASE_URL must be a valid PostgreSQL URL.");
}

const adminClient = new PrismaClient();
try {
  await adminClient.$executeRawUnsafe(
    `CREATE SCHEMA IF NOT EXISTS "${testSchema}"`,
  );
} finally {
  await adminClient.$disconnect();
}

const testEnvironment = {
  ...process.env,
  DATABASE_URL: testDatabaseUrl,
  NODE_ENV: "test",
  PORT: "5000",
  CORS_ORIGINS: process.env.CORS_ORIGINS || "http://localhost:5173",
};

function runPnpm(args) {
  return new Promise((resolve, reject) => {
    const child = spawn("pnpm", args, {
      cwd: packageRoot,
      env: testEnvironment,
      stdio: "inherit",
    });

    child.once("error", reject);
    child.once("close", (code, signal) => {
      if (code === 0) {
        resolve();
      } else {
        reject(
          new Error(
            signal
              ? `Command terminated by signal ${signal}`
              : `Command exited with status ${code ?? "unknown"}`,
          ),
        );
      }
    });
  });
}

await runPnpm([
  "exec",
  "prisma",
  "migrate",
  "deploy",
  "--schema",
  "prisma/schema.prisma",
]);
await runPnpm(["exec", "tsx", "prisma/seed.ts"]);
await runPnpm(["exec", "tsx", "--test", ...testFiles]);
