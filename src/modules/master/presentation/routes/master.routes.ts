import { Router } from 'express';
import { MasterController } from '../controllers/master.controller';
import { ITokenService } from '../../../../infrastructure/security/ITokenService';
import { createAuthMiddleware } from '../../../../middleware/auth.middleware';

export function createMasterRoutes(controller: MasterController, tokenService: ITokenService): Router {
  const router = Router();
  const authGuard = createAuthMiddleware(tokenService);
  router.use(authGuard);

  // Bulk routes (must precede /:id)
  router.post('/bulk', controller.bulkCreateMasters);
  router.patch('/bulk', controller.bulkUpdateMasters);
  router.delete('/bulk', controller.bulkDeleteMasters);

  // Collection routes
  router.get('/', controller.getMasters);
  router.post('/', controller.createMaster);

  // Individual item routes
  router.patch('/:id', controller.updateMaster);
  router.delete('/:id', controller.deleteMaster);

  return router;
}
