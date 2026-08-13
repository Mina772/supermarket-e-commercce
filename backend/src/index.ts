import http from 'http';
import { createApp } from './app';
import { env } from './config/env';
import { connectDatabase, disconnectDatabase } from './infra/db/mongoose';
import { logger } from './infra/logger/logger';

async function bootstrap(): Promise<void> {
  await connectDatabase();

  const app = createApp();
  const server = http.createServer(app);

  server.listen(env.PORT, () => {
    logger.info(`🚀 API running at http://localhost:${env.PORT}${env.API_PREFIX}`);
    logger.info(`📚 Docs at http://localhost:${env.PORT}${env.API_PREFIX}/docs`);
  });

  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`${signal} received. Shutting down gracefully...`);
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
    // Force-exit if not closed in time
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled Rejection', reason as Error);
  });
  process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception', err);
    process.exit(1);
  });
}

bootstrap().catch((err) => {
  logger.error('Fatal bootstrap error', err as Error);
  process.exit(1);
});
