import { NextFunction, Request, RequestHandler, Response } from 'express';
import crypto from 'crypto';
import helmet from 'helmet';
import hpp from 'hpp';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss';

/** Helmet with a sensible CSP for an API behind a reverse proxy. */
export const helmetMiddleware: RequestHandler = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'"],
    },
  },
  crossOriginResourcePolicy: { policy: 'cross-origin' },
});

/** Prevent NoSQL operator injection ($, .) in user input. */
export const mongoSanitizeMiddleware = mongoSanitize({ replaceWith: '_' });

/** Prevent HTTP parameter pollution. */
export const hppMiddleware = hpp();

/** Recursively sanitize string values against reflected XSS. */
export function xssSanitizer(req: Request, _res: Response, next: NextFunction): void {
  if (req.body) req.body = deepSanitize(req.body);
  next();
}

function deepSanitize(value: unknown): unknown {
  if (typeof value === 'string') return xss(value);
  if (Array.isArray(value)) return value.map(deepSanitize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, deepSanitize(v)]),
    );
  }
  return value;
}

/** Attaches a request id for tracing and echoes it back. */
export function requestId(req: Request, res: Response, next: NextFunction): void {
  const id = (req.headers['x-request-id'] as string) || crypto.randomUUID();
  req.requestId = id;
  res.setHeader('X-Request-Id', id);
  next();
}
