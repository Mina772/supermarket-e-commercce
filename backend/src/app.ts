import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import morgan from 'morgan';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env';
import { apiRouter } from './routes';
import { openApiDocument } from './docs/openapi';
import { httpLoggerStream } from './infra/logger/logger';
import { errorMiddleware } from './middlewares/error.middleware';
import { notFoundMiddleware } from './middlewares/notFound.middleware';
import { globalRateLimiter } from './middlewares/rateLimit.middleware';
import {
  helmetMiddleware,
  hppMiddleware,
  mongoSanitizeMiddleware,
  requestId,
  xssSanitizer,
} from './middlewares/security.middleware';

export function createApp(): Application {
  const app = express();

  app.set('trust proxy', 1);

  // Security & hardening
  app.use(requestId);
  app.use(helmetMiddleware);
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || env.corsOrigins.includes(origin) || env.isDev) return callback(null, true);
        return callback(new Error('Not allowed by CORS'));
      },
      credentials: true,
    }),
  );

  // Parsing
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(cookieParser(env.COOKIE_SECRET));

  // Sanitization
  app.use(mongoSanitizeMiddleware);
  app.use(hppMiddleware);
  app.use(xssSanitizer);

  // Performance
  app.use(compression());

  // Logging
  if (!env.isTest) {
    app.use(morgan(env.isProd ? 'combined' : 'dev', { stream: httpLoggerStream }));
  }

  // Static uploads
  app.use('/static', express.static(path.resolve(process.cwd(), env.UPLOAD_DIR)));

  // Rate limiting + API
  app.use(env.API_PREFIX, globalRateLimiter, apiRouter);

  // API docs
  app.use(`${env.API_PREFIX}/docs`, swaggerUi.serve, swaggerUi.setup(openApiDocument));

  // Root
  app.get('/', (_req: Request, res: Response) => {
    res.json({
      name: 'Supermarket Enterprise API',
      version: '1.0.0',
      docs: `${env.API_PREFIX}/docs`,
      health: `${env.API_PREFIX}/health`,
    });
  });

  // 404 + centralized error handler (must be last)
  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
}
