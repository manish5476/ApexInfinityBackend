import { Router } from 'express';
import { MasterTypeController } from '../controllers/masterType.controller';
import { ITokenService } from '../../../../infrastructure/security/ITokenService';
import { createAuthMiddleware } from '../../../../middleware/auth.middleware';

export function createMasterTypeRoutes(controller: MasterTypeController, tokenService: ITokenService): Router {
  const router = Router();
  const authGuard = createAuthMiddleware(tokenService);
  router.use(authGuard);

  router.get('/', controller.getMasterTypes);
  router.post('/', controller.createMasterType);
  router.patch('/:id', controller.updateMasterType);
  router.delete('/:id', controller.deleteMasterType);

  return router;
}
