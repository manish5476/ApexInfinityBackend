import { Router } from 'express';
import { SessionController } from '../controllers/session.controller';
import { ITokenService } from '../../../../infrastructure/security/ITokenService';
import { createAuthMiddleware } from '../../../../middleware/auth.middleware';
import { requirePermission } from '../../../../middleware/permission.middleware';

export function createSessionRoutes(
  controller: SessionController,
  tokenService: ITokenService
): Router {
  const router = Router();
  const authGuard = createAuthMiddleware(tokenService);

  router.use(authGuard);

  // Self sessions
  router.get('/me', controller.mySessions);

  // Admin session management
  router.get('/', requirePermission(['session:view_all']), controller.listSessions);
  router.delete('/bulk-delete', requirePermission(['user:manage']), controller.bulkDeleteSessions);
  router.delete('/:id', requirePermission(['user:manage']), controller.deleteSession);
  router.patch('/:id/revoke', requirePermission(['user:manage']), controller.revokeSession);
  router.patch('/revoke-all', requirePermission(['user:manage']), controller.revokeAllOthers);

  return router;
}
