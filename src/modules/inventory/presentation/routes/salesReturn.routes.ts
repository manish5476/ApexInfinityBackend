import { Router } from 'express';
import { SalesReturnController } from '../controllers/salesReturn.controller';
import { ITokenService } from '../../../../infrastructure/security/ITokenService';
import { createAuthMiddleware } from '../../../../middleware/auth.middleware';

export function createSalesReturnRoutes(
  controller: SalesReturnController,
  tokenService: ITokenService
): Router {
  const router = Router();
  const authGuard = createAuthMiddleware(tokenService);
  router.use(authGuard);

  // Workflow actions before /:id
  router.patch('/:id/approve', controller.approveReturn);
  router.patch('/:id/reject', controller.rejectReturn);

  // CRUD
  router.post('/', controller.createReturn);
  router.get('/', controller.getReturns);
  router.get('/:id', controller.getReturn);

  return router;
}
