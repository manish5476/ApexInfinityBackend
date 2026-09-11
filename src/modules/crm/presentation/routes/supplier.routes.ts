import { Router } from 'express';
import { SupplierController } from '../controllers/supplier.controller';
import { ITokenService } from '../../../../infrastructure/security/ITokenService';
import { createAuthMiddleware } from '../../../../middleware/auth.middleware';
import { requirePermission } from '../../../../middleware/permission.middleware';
import { upload } from '../../../../middleware/upload.middleware';

export function createSupplierRoutes(
  controller: SupplierController,
  tokenService: ITokenService
): Router {
  const router = Router();
  const authGuard = createAuthMiddleware(tokenService);

  router.use(authGuard);

  // Static routes (MUST precede /:id)
  router.get('/search', requirePermission(['supplier:read']), controller.searchSuppliers);
  router.get('/list', requirePermission(['supplier:read']), controller.getSupplierList);
  router.post('/bulk-supplier', requirePermission(['supplier:create']), controller.createbulkSupplier);

  // Collection CRUD
  router.get('/', requirePermission(['supplier:read']), controller.getAllSuppliers);
  router.post('/', requirePermission(['supplier:create']), controller.createSupplier);

  // KYC document routes
  router.post('/:id/kyc', requirePermission(['supplier:update']), upload.single('file'), controller.uploadKycDocument);
  router.delete('/:id/kyc/:docId', requirePermission(['supplier:update']), controller.deleteKycDocument);

  // Analytics & exports
  router.get('/:id/ledger-export', requirePermission(['supplier:read']), controller.downloadSupplierLedger);
  router.get('/:id/dashboard', requirePermission(['supplier:read']), controller.getSupplierDashboard);

  // Restore deleted supplier
  router.patch('/:id/restore', requirePermission(['supplier:update']), controller.restoreSupplier);

  // Dynamic ID CRUD
  router.get('/:id', requirePermission(['supplier:read']), controller.getSupplier);
  router.patch('/:id', requirePermission(['supplier:update']), controller.updateSupplier);
  router.delete('/:id', requirePermission(['supplier:delete']), controller.deleteSupplier);

  return router;
}
