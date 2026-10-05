import app from "./app";
import { env } from "./config/env";
import { prisma } from "./config/prisma";
import { logger } from "./lib/logger";

async function startServer(): Promise<void> {
  try {
    await prisma.$connect();
  } catch {
    logger.error("Unable to connect to PostgreSQL through Prisma");
    process.exit(1);
  }

  app.listen(env.port, (err) => {
    if (err) {
      logger.error({ err }, "Error listening on port");
      process.exit(1);
    }

    logger.info({ port: env.port }, "Server listening");
  });
}

void startServer();
