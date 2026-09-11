import { Router } from 'express';
import { RoleController } from '../controllers/role.controller';
import { ITokenService } from '../../../../infrastructure/security/ITokenService';
import { createAuthMiddleware } from '../../../../middleware/auth.middleware';
import { requirePermission } from '../../../../middleware/permission.middleware';

export function createRoleRoutes(
  controller: RoleController,
  tokenService: ITokenService
): Router {
  const router = Router();
  const authGuard = createAuthMiddleware(tokenService);

  router.use(authGuard);

  // Static routes
  router.get('/permissions', requirePermission(['role:manage']), controller.getAvailablePermissions);
  router.post('/assign', requirePermission(['role:manage']), controller.assignRoleToUser);
  router.post('/assign-bulk', requirePermission(['role:manage']), controller.assignRoleBulk);

  // Collection CRUD
  router.get('/', requirePermission(['role:manage']), controller.getRoles);
  router.post('/', requirePermission(['role:manage']), controller.createRole);

  // Parameterized /:id routes
  router.get('/:id', requirePermission(['role:manage']), controller.getRole);
  router.patch('/:id', requirePermission(['role:manage']), controller.updateRole);
  router.delete('/:id', requirePermission(['role:manage']), controller.deleteRole);

  return router;
}
