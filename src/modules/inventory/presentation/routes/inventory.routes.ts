import { Router } from 'express';
import { InventoryController } from '../controllers/inventory.controller';
import { ITokenService } from '../../../../infrastructure/security/ITokenService';
import { createAuthMiddleware } from '../../../../middleware/auth.middleware';

export function createProductRoutes(controller: InventoryController, tokenService: ITokenService): Router {
  const router = Router();
  const authGuard = createAuthMiddleware(tokenService);
  router.use(authGuard);

  // Search, Bulk & Reports (must be before /:id)
  router.get('/search', controller.searchProductsHandler);
  router.get('/reports/low-stock', controller.lowStockReportHandler);
  router.post('/scan', controller.scanProductHandler);
  router.post('/bulk-import', controller.bulkImportProductsHandler);
  router.post('/bulk-update', controller.bulkUpdateProductsHandler);

  // Specialized /:id endpoints
  router.patch('/:id/upload', controller.uploadProductImageHandler);
  router.patch('/:id/restore', controller.restoreProductHandler);
  router.get('/:id/history', controller.getProductHistoryHandler);
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

  // Stock Analytics & Monitoring
  router.get('/branch/:branchId', controller.getBranchStockHandler);
  router.get('/movement/:productId', controller.getStockMovementHandler);
  router.get('/low-stock', controller.lowStockReportHandler);
  router.get('/value', controller.getStockValueHandler);
  router.get('/aging', controller.getStockAgingHandler);
  router.put('/reorder-level/:productId', controller.updateReorderLevelHandler);

  // Stock Actions
  router.post('/transfer', controller.stockTransferHandler);
  router.post('/adjust', controller.stockAdjustHandler);

  return router;
}

export function createPurchaseRoutes(controller: InventoryController, tokenService: ITokenService): Router {
  const router = Router();
  const authGuard = createAuthMiddleware(tokenService);
  router.use(authGuard);

  // Analytics, Reports & Returns (before /:id)
  router.get('/analytics', controller.getPurchaseAnalyticsHandler);
  router.get('/pending-payments', controller.getPendingPaymentsHandler);
  router.get('/returns', controller.getAllReturnsHandler);
  router.get('/returns/:id', controller.getReturnByIdHandler);
  router.patch('/bulk-update', controller.bulkUpdatePurchasesHandler);

  // Specialized /:id sub-routes
  router.patch('/:id/status', controller.updatePurchaseStatusHandler);
  router.post('/:id/attachments', controller.addPurchaseAttachmentsHandler);
  router.delete('/:id/attachments/:fileIndex', controller.deletePurchaseAttachmentHandler);
  router.post('/:id/cancel', controller.cancelPurchaseOrderHandler);
  router.post('/:id/receive', controller.receiveStockHandler);
  router.post('/:id/payments', controller.recordPurchasePaymentHandler);
  router.get('/:id/payments', controller.getPurchasePaymentHistoryHandler);
  router.delete('/:id/payments/:paymentId', controller.deletePurchasePaymentHandler);
  router.post('/:id/return', controller.partialPurchaseReturnHandler);

  // Core Purchase CRUD
  router.get('/', controller.listPurchaseOrdersHandler);
  router.post('/', controller.createPurchaseOrderHandler);
  router.get('/:id', controller.getPurchaseOrderByIdHandler);
  router.patch('/:id', controller.updatePurchaseHandler);
  router.delete('/:id', controller.deletePurchaseHandler);

  return router;
}

export function createSalesRoutes(controller: InventoryController, tokenService: ITokenService): Router {
  const router = Router();
  const authGuard = createAuthMiddleware(tokenService);
  router.use(authGuard);

  // Analytics & Aggregations (before /:id)
  router.get('/stats', controller.getSalesStatsHandler);
  router.get('/export', controller.exportSalesHandler);
  router.get('/totals', controller.aggregateTotalsHandler);
  router.post('/from-invoice/:invoiceId', controller.createFromInvoiceHandler);

  // Core Sales CRUD & Actions
  router.get('/', controller.listSalesOrdersHandler);
  router.post('/', controller.createSalesOrderHandler);
  router.get('/:id', controller.getSalesOrderByIdHandler);
  router.put('/:id', controller.updateSalesHandler);
  router.patch('/:id', controller.updateSalesHandler);
  router.delete('/:id', controller.deleteSalesHandler);
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
