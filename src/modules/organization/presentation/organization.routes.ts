import { Router } from 'express';
import { OrganizationController } from './organization.controller';
import { ITokenService } from '../../../infrastructure/security/ITokenService';
import { createAuthMiddleware } from '../../../middleware/auth.middleware';

export function createOrganizationRoutes(
  controller: OrganizationController,
  tokenService?: ITokenService
): Router {
  const router = Router();
  const authGuard = tokenService ? createAuthMiddleware(tokenService) : (_req: any, _res: any, next: any) => next();

  // Public routes
  router.post('/', controller.create);
  router.post('/create', controller.create);
  router.get('/shop/:uniqueShopId', controller.getByShopId);

  // Self-service member / tenant routes (guarded)
  router.get('/my-organization', authGuard, controller.getMyOrganization);
  router.patch('/my-organization', authGuard, controller.updateMyOrganization);

  // Admin / ID-based routes
  router.get('/:id', controller.getById);
  router.patch('/:id', authGuard, controller.update);

  return router;
}
