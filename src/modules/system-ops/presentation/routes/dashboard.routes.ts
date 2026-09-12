import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { ITokenService } from '../../../../infrastructure/security/ITokenService';
import { createAuthMiddleware } from '../../../../middleware/auth.middleware';

export function createDashboardRoutes(
  controller: DashboardController,
  tokenService?: ITokenService
): Router {
  const router = Router();
  const authGuard = tokenService ? createAuthMiddleware(tokenService) : (_req: any, _res: any, next: any) => next();

  router.use(authGuard);

  router.get('/', controller.getDashboardOverview);

  return router;
}
