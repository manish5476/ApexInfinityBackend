import { Router } from 'express';
import { OwnershipController } from './ownership.controller';
import { ITokenService } from '../../../infrastructure/security/ITokenService';
import { createAuthMiddleware } from '../../../middleware/auth.middleware';
import { requirePermission } from '../../../middleware/permission.middleware';

export function createOwnershipRoutes(
  controller: OwnershipController,
  tokenService: ITokenService
): Router {
  const router = Router();
  const authGuard = createAuthMiddleware(tokenService);

  router.use(authGuard);

  router.post('/initiate', requirePermission(['ownership:transfer']), controller.initiateOwnershipTransfer);
  router.post('/finalize', requirePermission(['ownership:transfer']), controller.finalizeOwnershipTransfer);
  router.post('/cancel', requirePermission(['ownership:transfer']), controller.cancelOwnershipTransfer);
  router.post('/force', requirePermission(['ownership:transfer']), controller.forceTransferOwnership);

  return router;
}
