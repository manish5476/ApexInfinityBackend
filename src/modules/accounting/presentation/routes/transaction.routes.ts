import { Router } from 'express';
import { TransactionController } from '../controllers/transaction.controller';
import { ITokenService } from '../../../../infrastructure/security/ITokenService';
import { createAuthMiddleware } from '../../../../middleware/auth.middleware';
import { requirePermission } from '../../../../middleware/permission.middleware';

export function createTransactionRoutes(
  controller: TransactionController,
  tokenService: ITokenService
): Router {
  const router = Router();
  const authGuard = createAuthMiddleware(tokenService);

  router.use(authGuard);

  router.get('/export', requirePermission(['transaction:read']), controller.exportTransactionsCsv);
  router.get('/', requirePermission(['transaction:read']), controller.getTransactions);

  return router;
}
