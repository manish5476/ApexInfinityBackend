import { Router } from 'express';
import { StorefrontAdminController } from '../controllers/storefrontAdmin.controller';
import { ITokenService } from '../../../../infrastructure/security/ITokenService';
import { createAuthMiddleware } from '../../../../middleware/auth.middleware';

export function createStorefrontAdminRoutes(
  controller: StorefrontAdminController,
  tokenService: ITokenService
): Router {
  const router = Router();
  const authGuard = createAuthMiddleware(tokenService);
  router.use(authGuard);

  router.post('/pages', controller.createPageHandler);
  router.get('/pages', controller.listPagesHandler);
  router.post('/pages/:id/publish', controller.publishPageHandler);

  return router;
}
