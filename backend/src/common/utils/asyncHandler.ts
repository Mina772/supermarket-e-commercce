import { NextFunction, Request, Response, RequestHandler } from 'express';

type AsyncController = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

/**
 * Wraps an async controller so rejected promises are forwarded to the
 * centralized error middleware instead of crashing the process.
 */
export const asyncHandler =
  (fn: AsyncController): RequestHandler =>
  (req, res, next): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
