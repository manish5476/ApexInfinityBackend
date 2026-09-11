import { Router } from 'express';
import { AccountingController } from '../controllers/accounting.controller';
import { ITokenService } from '../../../../infrastructure/security/ITokenService';
import { createAuthMiddleware } from '../../../../middleware/auth.middleware';
import { requirePermission } from '../../../../middleware/permission.middleware';

export function createStatementRoutes(
  controller: AccountingController,
  tokenService: ITokenService
): Router {
  const router = Router();
  const authGuard = createAuthMiddleware(tokenService);

  router.use(authGuard);

  router.get('/pl', requirePermission(['statement:read']), controller.getProfitLossHandler);
  router.get('/balance-sheet', requirePermission(['statement:read']), controller.getBalanceSheetHandler);
  router.get('/trial-balance', requirePermission(['statement:read']), controller.getTrialBalanceHandler);
  router.get('/export', requirePermission(['statement:read']), controller.exportStatementHandler);

  return router;
}
