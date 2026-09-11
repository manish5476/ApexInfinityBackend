import { Router } from 'express';
import { EmiController } from '../controllers/emi.controller';
import { ITokenService } from '../../../../infrastructure/security/ITokenService';
import { createAuthMiddleware } from '../../../../middleware/auth.middleware';
import { requirePermission } from '../../../../middleware/permission.middleware';

export function createEmiRoutes(
  controller: EmiController,
  tokenService: ITokenService
): Router {
  const router = Router();
  const authGuard = createAuthMiddleware(tokenService);

  router.use(authGuard);

  // Static / utility routes (MUST precede /:id)
  router.get('/analytics', requirePermission(['emi:read']), controller.getEmiAnalytics);
  router.get('/ledger', requirePermission(['emi:read']), controller.getEmiLedgerReport);
  router.get('/mark-overdue', requirePermission(['emi:manage']), controller.markOverdueInstallments);
  router.post('/mark-overdue', requirePermission(['emi:manage']), controller.markOverdueInstallments);
  router.get('/invoice/:invoiceId', requirePermission(['emi:read']), controller.getEmiByInvoice);

  // Root collection CRUD
  router.get('/', requirePermission(['emi:read']), controller.getAllEmis);
  router.post('/', requirePermission(['emi:manage']), controller.createEmiPlan);

  // ID-based actions
  router.get('/:id', requirePermission(['emi:read']), controller.getEmiById);
  router.delete('/:id', requirePermission(['emi:manage']), controller.deleteEmi);
  router.post('/:id/pay', requirePermission(['emi:manage']), controller.payEmiInstallment);
  router.get('/:id/history', requirePermission(['emi:read']), controller.getEmiHistory);
  router.post('/:id/apply-advance', requirePermission(['emi:manage']), controller.applyAdvanceBalance);

  return router;
}
