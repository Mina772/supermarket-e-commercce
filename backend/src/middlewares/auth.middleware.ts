import { NextFunction, Request, Response } from 'express';
import { UnauthorizedError } from '../common/errors/AppError';
import { verifyAccessToken } from '../common/utils/jwt';

/**
 * Extracts a bearer access token (Authorization header or httpOnly cookie),
 * verifies it, and attaches the auth user to the request.
 */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const token = extractToken(req);
  if (!token) throw new UnauthorizedError('Authentication required');

  const payload = verifyAccessToken(token);
  req.user = { id: payload.sub, role: payload.role, email: payload.email };
  next();
}

/** Attaches user if a valid token exists, but never blocks the request. */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = extractToken(req);
  if (token) {
    try {
      const payload = verifyAccessToken(token);
      req.user = { id: payload.sub, role: payload.role, email: payload.email };
    } catch {
      /* ignore invalid token for optional auth */
    }
  }
  next();
}

function extractToken(req: Request): string | undefined {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice(7);
  const cookieToken = (req.cookies as Record<string, string> | undefined)?.accessToken;
  return cookieToken;
}
