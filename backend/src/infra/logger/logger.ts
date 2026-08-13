import winston from 'winston';
import { env } from '../../config/env';

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

const devFormat = combine(
  colorize(),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ level, message, timestamp: ts, stack, ...meta }) => {
    const rest = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `${ts} ${level}: ${stack || message}${rest}`;
  }),
);

const prodFormat = combine(timestamp(), errors({ stack: true }), json());

export const logger = winston.createLogger({
  level: env.isProd ? 'info' : 'debug',
  format: env.isProd ? prodFormat : devFormat,
  defaultMeta: { service: 'supermarket-api' },
  transports: [new winston.transports.Console()],
  silent: env.isTest,
});

/** Morgan-compatible stream. */
export const httpLoggerStream = {
  write: (message: string): void => {
    logger.http?.(message.trim()) ?? logger.info(message.trim());
  },
};
