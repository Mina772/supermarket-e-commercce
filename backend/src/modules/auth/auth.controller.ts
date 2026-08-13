import { CookieOptions, Request, Response } from 'express';
import { env } from '../../config/env';
import { ok, created } from '../../common/utils/apiResponse';
import { asyncHandler } from '../../common/utils/asyncHandler';
import { UnauthorizedError } from '../../common/errors/AppError';
import { User } from '../users/user.model';
import { NotFoundError } from '../../common/errors/AppError';
import { writeAuditLog } from '../../common/utils/auditLog.model';
import { authService } from './auth.service';

const REFRESH_COOKIE = 'refreshToken';
const ACCESS_COOKIE = 'accessToken';

function cookieOptions(maxAgeMs: number): CookieOptions {
  return {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: env.COOKIE_SECURE ? 'none' : 'lax',
    domain: env.COOKIE_DOMAIN,
    maxAge: maxAgeMs,
    path: '/',
  };
}

function setAuthCookies(res: Response, accessToken: string, refreshToken: string): void {
  res.cookie(ACCESS_COOKIE, accessToken, cookieOptions(15 * 60 * 1000));
  res.cookie(REFRESH_COOKIE, refreshToken, cookieOptions(7 * 24 * 60 * 60 * 1000));
}

function clearAuthCookies(res: Response): void {
  res.clearCookie(ACCESS_COOKIE, { path: '/', domain: env.COOKIE_DOMAIN });
  res.clearCookie(REFRESH_COOKIE, { path: '/', domain: env.COOKIE_DOMAIN });
}

export const authController = {
  register: asyncHandler(async (req: Request, res: Response) => {
    const { user, tokens } = await authService.register(req.body);
    setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
    await writeAuditLog({
      actor: user._id,
      actorEmail: user.email,
      action: 'auth.register',
      resource: 'user',
      resourceId: user.id,
      ip: req.ip,
    });
    return created(res, { user, ...tokens }, 'Registration successful');
  }),

  login: asyncHandler(async (req: Request, res: Response) => {
    const { user, tokens } = await authService.login(req.body.email, req.body.password);
    setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
    await writeAuditLog({
      actor: user._id,
      actorEmail: user.email,
      action: 'auth.login',
      resource: 'user',
      resourceId: user.id,
      ip: req.ip,
    });
    return ok(res, { user, ...tokens }, 'Login successful');
  }),

  refresh: asyncHandler(async (req: Request, res: Response) => {
    const token =
      (req.cookies as Record<string, string>)?.[REFRESH_COOKIE] ?? req.body.refreshToken;
    if (!token) throw new UnauthorizedError('Refresh token missing');
    const tokens = await authService.refresh(token);
    setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
    return ok(res, tokens, 'Token refreshed');
  }),

  logout: asyncHandler(async (req: Request, res: Response) => {
    if (req.user) await authService.logout(req.user.id);
    clearAuthCookies(res);
    return ok(res, null, 'Logged out');
  }),

  me: asyncHandler(async (req: Request, res: Response) => {
    const user = await User.findById(req.user!.id).populate('wishlist', 'name slug price thumbnail');
    if (!user) throw new NotFoundError('User not found');
    return ok(res, user, 'Current user');
  }),

  updateProfile: asyncHandler(async (req: Request, res: Response) => {
    const user = await User.findByIdAndUpdate(req.user!.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!user) throw new NotFoundError('User not found');
    return ok(res, user, 'Profile updated');
  }),

  verifyEmail: asyncHandler(async (req: Request, res: Response) => {
    await authService.verifyEmail(req.body.token);
    return ok(res, null, 'Email verified successfully');
  }),

  forgotPassword: asyncHandler(async (req: Request, res: Response) => {
    await authService.forgotPassword(req.body.email);
    return ok(res, null, 'If an account exists, a reset link has been sent');
  }),

  resetPassword: asyncHandler(async (req: Request, res: Response) => {
    await authService.resetPassword(req.body.token, req.body.password);
    return ok(res, null, 'Password reset successful');
  }),

  changePassword: asyncHandler(async (req: Request, res: Response) => {
    await authService.changePassword(req.user!.id, req.body.currentPassword, req.body.newPassword);
    clearAuthCookies(res);
    return ok(res, null, 'Password changed. Please log in again.');
  }),
};
