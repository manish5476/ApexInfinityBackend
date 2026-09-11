import { Router } from 'express';
import { ReconciliationController } from '../controllers/reconciliation.controller';
import { ITokenService } from '../../../../infrastructure/security/ITokenService';
import { createAuthMiddleware } from '../../../../middleware/auth.middleware';
import { requirePermission } from '../../../../middleware/permission.middleware';

export function createReconciliationRoutes(
  controller: ReconciliationController,
  tokenService: ITokenService
): Router {
  const router = Router();

  // Public gateway webhook (signature verified)
  router.post('/webhook/payment', controller.paymentGatewayWebhook);

  // Protected reconciliation management endpoints
  const authGuard = createAuthMiddleware(tokenService);
  router.use(authGuard);
  router.use(requirePermission(['reconciliation:manage']));

  router.get('/mismatches', controller.topMismatches);
  router.get('/mismatches/detail', controller.detail);
  router.get('/pending', controller.getPendingReconciliations);
  router.post('/manual', controller.manualReconcilePayment);
  router.get('/summary', controller.getReconciliationSummary);

  return router;
}
