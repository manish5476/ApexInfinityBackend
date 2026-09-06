import { Router } from 'express';
import { BranchController } from './branch.controller';
import { ITokenService } from '../../../infrastructure/security/ITokenService';
import { createAuthMiddleware } from '../../../middleware/auth.middleware';

export function createBranchRoutes(controller: BranchController, tokenService: ITokenService): Router {
  const router = Router();
  const authGuard = createAuthMiddleware(tokenService);

  router.use(authGuard);

  router.get('/my-branches', controller.list);
  router.post('/', controller.create);
  router.get('/', controller.list);
  router.get('/:id', controller.getById);
  router.patch('/:id', controller.update);
  router.delete('/:id', controller.delete);

  return router;
}
