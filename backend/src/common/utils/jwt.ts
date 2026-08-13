import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../../config/env';
import { Role } from '../constants/roles';
import { UnauthorizedError } from '../errors/AppError';

export interface AccessTokenPayload {
  sub: string; // user id
  role: Role;
  email: string;
  tokenType: 'access';
}

export interface RefreshTokenPayload {
  sub: string;
  tokenVersion: number;
  tokenType: 'refresh';
}

export function signAccessToken(payload: Omit<AccessTokenPayload, 'tokenType'>): string {
  return jwt.sign({ ...payload, tokenType: 'access' }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  } as SignOptions);
}

export function signRefreshToken(payload: Omit<RefreshTokenPayload, 'tokenType'>): string {
  return jwt.sign({ ...payload, tokenType: 'refresh' }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  } as SignOptions);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
    if (decoded.tokenType !== 'access') throw new Error('wrong token type');
    return decoded;
  } catch {
    throw new UnauthorizedError('Invalid or expired access token');
  }
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
    if (decoded.tokenType !== 'refresh') throw new Error('wrong token type');
    return decoded;
  } catch {
    throw new UnauthorizedError('Invalid or expired refresh token');
  }
}
