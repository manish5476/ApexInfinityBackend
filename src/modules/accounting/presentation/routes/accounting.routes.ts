import { Router } from 'express';
import { AccountingController } from '../controllers/accounting.controller';
import { ITokenService } from '../../../../infrastructure/security/ITokenService';
import { createAuthMiddleware } from '../../../../middleware/auth.middleware';

export function createInvoiceRoutes(controller: AccountingController, tokenService: ITokenService): Router {
  const router = Router();
  const authGuard = createAuthMiddleware(tokenService);
  router.use(authGuard);

  // Analytics & reporting (must be before /:id)
  router.get('/invoiceanalytics/profit-summary', controller.profitSummaryHandler);
  router.get('/invoiceanalytics/profit', controller.getProfitAnalysisHandler);
  router.get('/invoiceanalytics/advanced-profit', controller.getAdvancedProfitAnalysisHandler);
  router.get('/invoiceanalytics/profit-dashboard', controller.getProfitDashboardHandler);
  router.get('/invoiceanalytics/export-profit', controller.exportProfitHandler);
  router.get('/invoiceanalytics/product-profit/:productId', controller.getProductProfitHandler);
  router.get('/reports/profit', controller.getReportsProfitHandler);
  router.get('/reports/sales', controller.getReportsSalesHandler);
  router.get('/reports/tax', controller.getReportsTaxHandler);
  router.get('/reports/outstanding', controller.getOutstandingInvoicesReportHandler);
  router.post('/check-stock', controller.checkStockHandler);
  router.patch('/bulk/status', controller.bulkStatusHandler);
  router.post('/bulk/cancel', controller.bulkCancelHandler);
  router.get('/validate/number/:number', controller.validateNumberHandler);
  router.get('/export/all', controller.exportAllInvoicesHandler);
  router.get('/search/:query', controller.searchInvoicesHandler);
  router.get('/drafts/all', controller.getDraftInvoicesHandler);
  router.get('/trash/all', controller.getTrashInvoicesHandler);
  router.get('/customer/:customerId/summary', controller.getCustomerInvoiceSummaryHandler);
  router.get('/customer/:customerId', controller.getCustomerInvoicesHandler);

  // Sub-resource routes
  router.get('/:id/stock-info', controller.getInvoiceStockInfoHandler);
  router.get('/:id/low-stock', controller.getInvoiceLowStockHandler);
  router.post('/:id/convert', controller.convertInvoiceHandler);
  router.get('/:id/history', controller.getInvoiceHistoryHandler);
  router.get('/:id/download', controller.getInvoiceByIdHandler);
  router.post('/:id/email', controller.getInvoiceByIdHandler);
  router.get('/:id/payments', controller.getInvoicePaymentsHandler);
  router.post('/:id/payments', controller.recordPaymentHandler);
  router.post('/:id/cancel', controller.cancelInvoiceHandler);
  router.post('/:id/restore', controller.restoreInvoiceHandler);

  // Core CRUD
  router.get('/', controller.listInvoicesHandler);
  router.post('/', controller.createInvoiceHandler);
  router.get('/:id', controller.getInvoiceByIdHandler);
  router.patch('/:id', controller.updateInvoiceHandler);
  router.delete('/:id', controller.deleteInvoiceHandler);

  return router;
}

export function createPaymentRoutes(controller: AccountingController, tokenService: ITokenService): Router {
  const router = Router();
  const authGuard = createAuthMiddleware(tokenService);
  router.use(authGuard);

  // Static & summary queries (before /:id)
  router.post('/webhook', controller.paymentWebhookHandler);
  router.get('/export', controller.exportPaymentsHandler);
  router.get('/allocation/report', controller.getAllocationReportHandler);
  router.get('/customer/:customerId/summary', controller.getCustomerPaymentSummaryHandler);
  router.get('/customer/:customerId/unallocated', controller.getCustomerUnallocatedPaymentsHandler);
  router.get('/customer/:customerId', controller.getCustomerPaymentsHandler);
  router.get('/supplier/:supplierId', controller.getSupplierPaymentsHandler);

  // Allocation actions
  router.post('/:paymentId/allocate/auto', controller.autoAllocatePaymentHandler);
  router.post('/:paymentId/allocate/manual', controller.manualAllocatePaymentHandler);

  // Receipts
  router.get('/:id/receipt', controller.getPaymentReceiptHandler);
  router.post('/:id/email', controller.emailPaymentReceiptHandler);
  router.post('/:id/cancel', controller.cancelPaymentHandler);

  // Core CRUD
  router.get('/', controller.listPaymentsHandler);
  router.post('/', controller.createPaymentHandler);
  router.get('/:id', controller.getPaymentByIdHandler);
  router.delete('/:id', controller.cancelPaymentHandler);

  return router;
}

export function createAccountRoutes(controller: AccountingController, tokenService: ITokenService): Router {
  const router = Router();
  const authGuard = createAuthMiddleware(tokenService);
  router.use(authGuard);

  router.get('/hierarchy', controller.getAccountHierarchyHandler);
  router.put('/:id/reparent', controller.reparentAccountHandler);

  router.get('/', controller.listAccountsHandler);
  router.post('/', controller.createAccountHandler);
  router.get('/:id', controller.getAccountByIdHandler);
  router.put('/:id', controller.updateAccountHandler);
  router.delete('/:id', controller.deleteAccountHandler);

  return router;
}

export function createLedgerRoutes(controller: AccountingController, tokenService: ITokenService): Router {
  const router = Router();
  const authGuard = createAuthMiddleware(tokenService);
  router.use(authGuard);

  router.get('/summary/trial-balance', controller.getTrialBalanceHandler);
  router.get('/summary/profit-loss', controller.getProfitLossHandler);
  router.get('/summary/balance-sheet', controller.getBalanceSheetHandler);
  router.get('/customer/:customerId', controller.getCustomerLedgerHandler);
  router.get('/account/:accountId', controller.getAccountLedgerHandler);
  router.get('/', controller.listLedgerEntriesHandler);

  return router;
}

export function createAccountingRoutes(controller: AccountingController, tokenService: ITokenService): Router {
  const router = Router();
  const authGuard = createAuthMiddleware(tokenService);
  router.use(authGuard);

  router.use('/invoices', createInvoiceRoutes(controller, tokenService));
  router.use('/payments', createPaymentRoutes(controller, tokenService));
  router.use('/accounts', createAccountRoutes(controller, tokenService));
  router.use('/ledgers', createLedgerRoutes(controller, tokenService));

  return router;
}
