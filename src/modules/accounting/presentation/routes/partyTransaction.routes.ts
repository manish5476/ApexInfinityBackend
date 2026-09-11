import { Router } from 'express';
import { TransactionController } from '../controllers/transaction.controller';
import { ITokenService } from '../../../../infrastructure/security/ITokenService';
import { createAuthMiddleware } from '../../../../middleware/auth.middleware';
import { requirePermission } from '../../../../middleware/permission.middleware';

export function createPartyTransactionRoutes(
  controller: TransactionController,
  tokenService: ITokenService
): Router {
  const router = Router();
  const authGuard = createAuthMiddleware(tokenService);

  router.use(authGuard);

  router.get('/customers/:id/transactions', requirePermission(['transaction:read']), controller.getCustomerTransactions);
  router.get('/suppliers/:id/transactions', requirePermission(['transaction:read']), controller.getSupplierTransactions);

  return router;
}
