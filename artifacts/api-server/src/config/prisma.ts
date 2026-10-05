import { PrismaClient } from "@prisma/client";
import { env } from "./env";

const prismaGlobal = globalThis as typeof globalThis & {
  cyberlabPrisma?: PrismaClient;
};

export const prisma =
  prismaGlobal.cyberlabPrisma ??
  new PrismaClient({
    log: env.nodeEnv === "development" ? ["warn", "error"] : ["error"],
  });

if (env.nodeEnv !== "production") {
  prismaGlobal.cyberlabPrisma = prisma;
}
