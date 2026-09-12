import { Router } from 'express';
import { OrganizationController } from './organization.controller';
import { ITokenService } from '../../../infrastructure/security/ITokenService';
import { createAuthMiddleware } from '../../../middleware/auth.middleware';

export function createOrganizationExtrasRoutes(
  controller: OrganizationController,
  tokenService?: ITokenService
): Router {
  const router = Router();
  const authGuard = tokenService ? createAuthMiddleware(tokenService) : (_req: any, _res: any, next: any) => next();

  router.use(authGuard);

  router.post('/invite', controller.inviteUser);
  router.get('/activity-log', controller.getActivityLog);
  router.delete('/members/:id', controller.removeMember);

  return router;
}
