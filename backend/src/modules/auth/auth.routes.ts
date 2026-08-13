import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { authRateLimiter } from '../../middlewares/rateLimit.middleware';
import { authController } from './auth.controller';
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  updateProfileSchema,
  verifyEmailSchema,
} from './auth.validation';

const router = Router();

router.post('/register', authRateLimiter, validate({ body: registerSchema }), authController.register);
router.post('/login', authRateLimiter, validate({ body: loginSchema }), authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);

router.post('/verify-email', validate({ body: verifyEmailSchema }), authController.verifyEmail);
router.post(
  '/forgot-password',
  authRateLimiter,
  validate({ body: forgotPasswordSchema }),
  authController.forgotPassword,
);
router.post('/reset-password', validate({ body: resetPasswordSchema }), authController.resetPassword);

// Authenticated
router.get('/me', authenticate, authController.me);
router.patch('/me', authenticate, validate({ body: updateProfileSchema }), authController.updateProfile);
router.post(
  '/change-password',
  authenticate,
  validate({ body: changePasswordSchema }),
  authController.changePassword,
);

export const authRoutes = router;
