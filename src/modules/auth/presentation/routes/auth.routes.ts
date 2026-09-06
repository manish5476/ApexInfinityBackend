import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { ITokenService } from '../../../../infrastructure/security/ITokenService';
import { createAuthMiddleware } from '../../../../middleware/auth.middleware';
import { createRateLimiter } from '../../../../middleware/rateLimit.middleware';

export function createAuthRoutes(
  controller: AuthController,
  tokenService: ITokenService
): Router {
  const router = Router();
  const authGuard = createAuthMiddleware(tokenService);
  const forgotPasswordLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Too many password reset attempts. Please try again later.',
  });

  router.post('/register', controller.register);
  router.post('/signup', controller.register);
  router.post('/login', controller.login);
  router.post('/refresh-token', controller.refreshToken);
  router.post('/forgot-password', forgotPasswordLimiter, controller.forgotPassword);
  router.patch('/reset-password/:token', controller.resetPassword);
  router.get('/verify-token', controller.verifyToken);
  router.get('/verify-email/:token', controller.verifyEmail);

  router.patch('/update-my-password', authGuard, controller.updateMyPassword);
  router.post('/send-verification-email', authGuard, controller.sendVerificationEmail);
  router.post('/logout', authGuard, controller.logout);
  router.post('/logout-all', authGuard, controller.logoutAll);
  router.get('/me', authGuard, controller.me);
  router.get('/users', authGuard, controller.listUsers);
  router.get('/users/:id', authGuard, controller.getUserById);

  return router;
}
