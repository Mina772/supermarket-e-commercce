import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import { ZodError } from 'zod';
import { AppError } from '../common/errors/AppError';
import { env } from '../config/env';
import { logger } from '../infra/logger/logger';

interface ErrorBody {
  success: false;
  message: string;
  code: string;
  details?: unknown;
  stack?: string;
  timestamp: string;
  path: string;
}

/** Centralized error handler. Normalizes every error into a stable envelope. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorMiddleware(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  let statusCode = 500;
  let message = 'Internal server error';
  let code = 'INTERNAL_ERROR';
  let details: unknown;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    code = err.code;
    details = err.details;
  } else if (err instanceof ZodError) {
    statusCode = 422;
    code = 'VALIDATION_ERROR';
    message = 'Validation failed';
    details = err.flatten();
  } else if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 422;
    code = 'VALIDATION_ERROR';
    message = 'Validation failed';
    details = Object.fromEntries(
      Object.entries(err.errors).map(([k, v]) => [k, v.message]),
    );
  } else if (err instanceof mongoose.Error.CastError) {
    statusCode = 400;
    code = 'INVALID_ID';
    message = `Invalid value for field "${err.path}"`;
  } else if (isDuplicateKeyError(err)) {
    statusCode = 409;
    code = 'DUPLICATE_KEY';
    const field = Object.keys(err.keyValue ?? {})[0] ?? 'field';
    message = `Duplicate value for "${field}"`;
    details = err.keyValue;
  } else if (err instanceof Error) {
    message = env.isProd ? 'Internal server error' : err.message;
  }

  const body: ErrorBody = {
    success: false,
    message,
    code,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
  };
  if (details !== undefined) body.details = details;
  if (!env.isProd && err instanceof Error) body.stack = err.stack;

  if (statusCode >= 500) {
    logger.error(`${req.method} ${req.originalUrl} -> ${statusCode}`, err as Error);
  } else {
    logger.warn(`${req.method} ${req.originalUrl} -> ${statusCode} ${message}`);
  }

  res.status(statusCode).json(body);
}

interface MongoDuplicateError {
  code: number;
  keyValue?: Record<string, unknown>;
}

function isDuplicateKeyError(err: unknown): err is MongoDuplicateError {
  return typeof err === 'object' && err !== null && (err as { code?: number }).code === 11000;
}
