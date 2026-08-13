import rateLimit from 'express-rate-limit';
import { env } from '../config/env';

const baseHandler = {
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    code: 'RATE_LIMITED',
    message: 'Too many requests, please try again later.',
  },
};

/** Global limiter applied to the whole API. */
export const globalRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  ...baseHandler,
});

/** Stricter limiter for authentication endpoints (brute-force protection). */
export const authRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.AUTH_RATE_LIMIT_MAX,
  ...baseHandler,
});
