import { Router } from 'express';
import { SearchController } from '../controllers/search.controller';
import { ITokenService } from '../../../../infrastructure/security/ITokenService';
import { createAuthMiddleware } from '../../../../middleware/auth.middleware';

export function createSearchRoutes(
  controller: SearchController,
  tokenService?: ITokenService
): Router {
  const router = Router();
  const authGuard = tokenService ? createAuthMiddleware(tokenService) : (_req: any, _res: any, next: any) => next();

  router.use(authGuard);

  router.get('/', controller.globalSearch);
  router.get('/lookup', controller.quickLookup);
  router.get('/global', controller.globalSearch);
  router.get('/globalchat', controller.globalChat);

  return router;
}
