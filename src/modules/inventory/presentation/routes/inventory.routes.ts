import { Router } from 'express';
import { InventoryController } from '../controllers/inventory.controller';
import { ITokenService } from '../../../../infrastructure/security/ITokenService';
import { createAuthMiddleware } from '../../../../middleware/auth.middleware';

export function createProductRoutes(controller: InventoryController, tokenService: ITokenService): Router {
  const router = Router();
  const authGuard = createAuthMiddleware(tokenService);
  router.use(authGuard);

  // Search & Reports (must be before /:id)
  router.get('/search', controller.searchProductsHandler);
  router.get('/reports/low-stock', controller.lowStockReportHandler);
  router.post('/scan', controller.scanProductHandler);
  router.post('/bulk-update', controller.bulkUpdateProductsHandler);

  // Specialized /:id endpoints
  router.patch('/:id/restore', controller.restoreProductHandler);
  router.post('/:id/stock-adjust', controller.stockAdjustHandler);
  router.post('/:id/stock-transfer', controller.stockTransferHandler);

  // Core Product CRUD
  router.get('/', controller.listProductsHandler);
  router.post('/', controller.createProductHandler);
  router.get('/:id', controller.getProductByIdHandler);
  router.patch('/:id', controller.updateProductHandler);
  router.delete('/:id', controller.deleteProductHandler);

  return router;
}

export function createStockRoutes(controller: InventoryController, tokenService: ITokenService): Router {
  const router = Router();
  const authGuard = createAuthMiddleware(tokenService);
  router.use(authGuard);

  router.post('/transfer', controller.stockTransferHandler);
  router.post('/adjust', controller.stockAdjustHandler);
  router.get('/low-stock', controller.lowStockReportHandler);

  return router;
}

export function createPurchaseRoutes(controller: InventoryController, tokenService: ITokenService): Router {
  const router = Router();
  const authGuard = createAuthMiddleware(tokenService);
  router.use(authGuard);

  router.get('/', controller.listPurchaseOrdersHandler);
  router.post('/', controller.createPurchaseOrderHandler);
  router.get('/:id', controller.getPurchaseOrderByIdHandler);
  router.post('/:id/receive', controller.receiveStockHandler);
  router.post('/:id/cancel', controller.cancelPurchaseOrderHandler);

  return router;
}

export function createSalesRoutes(controller: InventoryController, tokenService: ITokenService): Router {
  const router = Router();
  const authGuard = createAuthMiddleware(tokenService);
  router.use(authGuard);

  router.get('/', controller.listSalesOrdersHandler);
  router.post('/', controller.createSalesOrderHandler);
  router.get('/:id', controller.getSalesOrderByIdHandler);
  router.post('/:id/dispatch', controller.dispatchSalesOrderHandler);
  router.post('/:id/cancel', controller.cancelSalesOrderHandler);

  return router;
}

export function createInventoryRoutes(controller: InventoryController, tokenService: ITokenService): Router {
  const router = Router();
  const authGuard = createAuthMiddleware(tokenService);
  router.use(authGuard);

  // Nested sub-routers
  router.use('/products', createProductRoutes(controller, tokenService));
  router.use('/stock', createStockRoutes(controller, tokenService));
  router.use('/purchases', createPurchaseRoutes(controller, tokenService));
  router.use('/purchase-orders', createPurchaseRoutes(controller, tokenService));
  router.use('/sales', createSalesRoutes(controller, tokenService));
  router.use('/sales-orders', createSalesRoutes(controller, tokenService));

  // Direct operations under /inventory/
  router.post('/adjust', controller.stockAdjustHandler);
  router.post('/transfer', controller.stockTransferHandler);

  return router;
}
