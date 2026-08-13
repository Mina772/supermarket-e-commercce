import mongoose from 'mongoose';
import { env } from '../../config/env';
import { logger } from '../logger/logger';

mongoose.set('strictQuery', true);

let isConnected = false;

/**
 * Connects to MongoDB with sensible production pool settings and
 * exponential-backoff retry. Idempotent.
 */
export async function connectDatabase(uri: string = env.MONGODB_URI): Promise<typeof mongoose> {
  if (isConnected) return mongoose;

  const maxRetries = 5;
  let attempt = 0;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      await mongoose.connect(uri, {
        maxPoolSize: 50,
        minPoolSize: 5,
        serverSelectionTimeoutMS: 10_000,
        socketTimeoutMS: 45_000,
        family: 4,
      });
      isConnected = true;
      logger.info(`✅ MongoDB connected: ${redact(uri)}`);
      break;
    } catch (err) {
      attempt += 1;
      if (attempt >= maxRetries) {
        logger.error('❌ MongoDB connection failed permanently', err as Error);
        throw err;
      }
      const backoff = Math.min(1000 * 2 ** attempt, 15_000);
      logger.warn(`MongoDB connection attempt ${attempt} failed. Retrying in ${backoff}ms`);
      await new Promise((r) => setTimeout(r, backoff));
    }
  }

  mongoose.connection.on('disconnected', () => {
    isConnected = false;
    logger.warn('MongoDB disconnected');
  });
  mongoose.connection.on('error', (err) => logger.error('MongoDB error', err));

  return mongoose;
}

export async function disconnectDatabase(): Promise<void> {
  if (!isConnected) return;
  await mongoose.disconnect();
  isConnected = false;
  logger.info('MongoDB disconnected gracefully');
}

function redact(uri: string): string {
  return uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');
}
