import { IUser, User } from '../users/user.model';
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from '../../common/errors/AppError';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../common/utils/jwt';
import { generateRandomToken, sha256 } from '../../common/utils/password';
import { logger } from '../../infra/logger/logger';
import { RegisterDto } from './auth.validation';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResult {
  user: IUser;
  tokens: AuthTokens;
}

/**
 * Auth domain service. Contains all authentication business rules and is
 * transport-agnostic (no Express types) — controllers adapt HTTP to it.
 */
export class AuthService {
  async register(dto: RegisterDto): Promise<AuthResult> {
    const existing = await User.findOne({ email: dto.email }).lean();
    if (existing) throw new ConflictError('An account with this email already exists');

    const verificationToken = generateRandomToken();
    const user = await User.create({
      ...dto,
      emailVerificationToken: sha256(verificationToken),
      emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    // In production the raw token is emailed to the user.
    logger.info(`📧 Email verification token for ${user.email}: ${verificationToken}`);

    const tokens = this.issueTokens(user);
    return { user, tokens };
  }

  async login(email: string, password: string): Promise<AuthResult> {
    const user = await User.findOne({ email }).select('+password');
    if (!user) throw new UnauthorizedError('Invalid email or password');
    if (!user.isActive) throw new UnauthorizedError('Account is disabled');

    const matches = await user.comparePassword(password);
    if (!matches) throw new UnauthorizedError('Invalid email or password');

    user.lastLoginAt = new Date();
    await user.save();

    const tokens = this.issueTokens(user);
    return { user, tokens };
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    const payload = verifyRefreshToken(refreshToken);
    const user = await User.findById(payload.sub);
    if (!user || !user.isActive) throw new UnauthorizedError('Invalid session');
    if (user.tokenVersion !== payload.tokenVersion) {
      throw new UnauthorizedError('Session revoked, please log in again');
    }
    return this.issueTokens(user);
  }

  /** Rotates tokenVersion so all previously-issued refresh tokens are invalidated. */
  async logout(userId: string): Promise<void> {
    await User.findByIdAndUpdate(userId, { $inc: { tokenVersion: 1 } });
  }

  async verifyEmail(rawToken: string): Promise<void> {
    const hashed = sha256(rawToken);
    const user = await User.findOne({
      emailVerificationToken: hashed,
      emailVerificationExpires: { $gt: new Date() },
    }).select('+emailVerificationToken +emailVerificationExpires');
    if (!user) throw new BadRequestError('Invalid or expired verification token');

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await User.findOne({ email });
    // Do not reveal whether the email exists.
    if (!user) return;

    const rawToken = generateRandomToken();
    user.passwordResetToken = sha256(rawToken);
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    logger.info(`🔑 Password reset token for ${user.email}: ${rawToken}`);
  }

  async resetPassword(rawToken: string, newPassword: string): Promise<void> {
    const hashed = sha256(rawToken);
    const user = await User.findOne({
      passwordResetToken: hashed,
      passwordResetExpires: { $gt: new Date() },
    }).select('+passwordResetToken +passwordResetExpires');
    if (!user) throw new BadRequestError('Invalid or expired reset token');

    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.tokenVersion += 1; // revoke existing sessions
    await user.save();
  }

  async changePassword(userId: string, current: string, next: string): Promise<void> {
    const user = await User.findById(userId).select('+password');
    if (!user) throw new NotFoundError('User not found');
    const matches = await user.comparePassword(current);
    if (!matches) throw new BadRequestError('Current password is incorrect');
    user.password = next;
    user.tokenVersion += 1;
    await user.save();
  }

  issueTokens(user: IUser): AuthTokens {
    return {
      accessToken: signAccessToken({ sub: user.id, role: user.role, email: user.email }),
      refreshToken: signRefreshToken({ sub: user.id, tokenVersion: user.tokenVersion }),
    };
  }
}

export const authService = new AuthService();
