import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { ITokenService } from '../../../../infrastructure/security/ITokenService';
import { createAuthMiddleware } from '../../../../middleware/auth.middleware';
import { requirePermission } from '../../../../middleware/permission.middleware';
import { upload } from '../../../../middleware/upload.middleware';

export function createUserRoutes(
  controller: UserController,
  tokenService: ITokenService
): Router {
  const router = Router();
  const authGuard = createAuthMiddleware(tokenService);

  router.use(authGuard);

  // 1. Self management routes (Must be before /:id)
  router.get('/me', controller.getMyProfile);
  router.patch('/me', controller.updateMyProfile);
  router.post('/me/photo', upload.single('photo'), controller.uploadProfilePhoto);
  router.get('/me/permissions', controller.getMyPermissions);
  router.get('/me/devices', controller.getMyDevices);
  router.delete('/me/devices/:sessionId', controller.revokeDevice);

  // 2. Static directory & admin utility routes
  router.get('/all-permissions', requirePermission(['user:manage']), controller.getAllAvailablePermissions);
  router.get('/search', requirePermission(['user:read']), controller.searchUsers);
  router.get('/hierarchy', requirePermission(['user:read']), controller.getOrgHierarchy);
  router.get('/export', requirePermission(['user:read']), controller.exportUsers);
  router.post('/check-permission', controller.checkPermission);
  router.post('/toggle-block', requirePermission(['user:manage']), controller.toggleUserBlock);
  router.post('/bulk-status', requirePermission(['user:manage']), controller.bulkUpdateStatus);

  // 3. Collection CRUD
  router.get('/', requirePermission(['user:read']), controller.getAllUsers);
  router.post('/', requirePermission(['user:manage']), controller.createUser);

  // 4. Sub-resource & Specific Action routes (MUST precede generic /:id)
  router.get('/by-department/:departmentId', requirePermission(['user:read']), controller.getUsersByDepartment);
  router.get('/:id/activity', requirePermission(['user:manage']), controller.getUserActivity);
  router.post('/:id/photo', requirePermission(['user:manage']), upload.single('photo'), controller.uploadUserPhotoByAdmin);
  router.patch('/:id/photo', requirePermission(['user:manage']), upload.single('photo'), controller.uploadUserPhotoByAdmin);
  router.patch('/:id/password', requirePermission(['user:manage']), controller.adminUpdatePassword);
  router.patch('/:id/activate', requirePermission(['user:manage']), controller.activateUser);
  router.patch('/:id/deactivate', requirePermission(['user:manage']), controller.deactivateUser);
  router.patch('/:id/permission-overrides', requirePermission(['user:manage']), controller.updatePermissionOverrides);

  // 5. Dynamic /:id CRUD & Lifecycle
  router.get('/:id', requirePermission(['user:read']), controller.getUser);
  router.patch('/:id', requirePermission(['user:manage']), controller.updateUser);
  router.delete('/:id', requirePermission(['user:manage']), controller.deleteUser);
  router.post('/:id/change-role', requirePermission(['user:manage']), controller.changeRole);
  router.post('/:id/reset-password', requirePermission(['user:manage']), controller.adminResetPassword);
  router.post('/:id/resend-invite', requirePermission(['user:manage']), controller.resendInvite);
  router.post('/:id/restore', requirePermission(['user:manage']), controller.restoreUser);

  return router;
}
