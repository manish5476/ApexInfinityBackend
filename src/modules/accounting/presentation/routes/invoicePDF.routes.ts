import { Router } from 'express';
import { InvoicePDFController } from '../controllers/invoicePDF.controller';
import { ITokenService } from '../../../../infrastructure/security/ITokenService';
import { createAuthMiddleware } from '../../../../middleware/auth.middleware';
import { requirePermission } from '../../../../middleware/permission.middleware';

export function createInvoicePdfRoutes(
  controller: InvoicePDFController,
  tokenService: ITokenService
): Router {
  const router = Router();
  const authGuard = createAuthMiddleware(tokenService);

  router.use(authGuard);

  router.get('/:id/download', requirePermission(['invoice:download']), controller.downloadInvoicePDF);
  router.post('/:id/email', requirePermission(['invoice:download']), controller.emailInvoice);

  return router;
}
