import { existsSync } from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

const envFile = [
  path.resolve(process.cwd(), ".env"),
  path.resolve(process.cwd(), "../../.env"),
].find((candidate) => existsSync(candidate));

if (envFile) {
  dotenv.config({ path: envFile });
}

function requiredString(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

function parsePort(value: string): number {
  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be a valid TCP port");
  }
  return port;
}

function parseDatabaseUrl(value: string): string {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error("DATABASE_URL must be a valid PostgreSQL connection URL");
  }

  if (!["postgres:", "postgresql:"].includes(parsed.protocol)) {
    throw new Error("DATABASE_URL must use the PostgreSQL protocol");
  }

  return value;
}

function parseCorsOrigins(value: string | undefined): string[] {
  const origins = (value ?? "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  for (const origin of origins) {
    let parsed: URL;
    try {
      parsed = new URL(origin);
    } catch {
      throw new Error("CORS_ORIGINS must contain valid origin URLs");
    }

    if (
      !["http:", "https:"].includes(parsed.protocol) ||
      parsed.origin !== origin
    ) {
      throw new Error("CORS_ORIGINS must contain only HTTP or HTTPS origins");
    }
  }

  return origins;
}

const nodeEnv = process.env.NODE_ENV ?? "development";
if (!["development", "production", "test"].includes(nodeEnv)) {
  throw new Error("NODE_ENV must be development, production, or test");
}

export const env = {
  port: parsePort(requiredString("PORT")),
  databaseUrl: parseDatabaseUrl(requiredString("DATABASE_URL")),
  corsOrigins: parseCorsOrigins(process.env.CORS_ORIGINS),
  nodeEnv,
} as const;
