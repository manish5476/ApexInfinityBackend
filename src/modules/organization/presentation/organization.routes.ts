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
  router.post('/lookup', controller.lookupOrganizations);
  router.get('/shop/:uniqueShopId', controller.getByShopId);

  // Member management
  router.get('/pending-members', authGuard, controller.getPendingMembers);
  router.post('/approve-member', authGuard, controller.approveMember);
  router.post('/reject-member', authGuard, controller.rejectMember);

  // Self-service member / tenant routes (guarded)
  router.get('/my-organization', authGuard, controller.getMyOrganization);
  router.patch('/my-organization', authGuard, controller.updateMyOrganization);
  router.delete('/my-organization', authGuard, controller.deleteMyOrganization);

  // Platform admin / ID-based routes
  router.get('/', authGuard, controller.getAllOrganizations);
  router.get('/:id', controller.getById);
  router.patch('/:id', authGuard, controller.update);
  router.delete('/:id', authGuard, controller.deleteOrganization);

  return router;
}
