import { Router } from 'express';
import { AccountingController } from '../controllers/accounting.controller';
import { ITokenService } from '../../../../infrastructure/security/ITokenService';
import { createAuthMiddleware } from '../../../../middleware/auth.middleware';

export function createInvoiceRoutes(controller: AccountingController, tokenService: ITokenService): Router {
  const router = Router();
  const authGuard = createAuthMiddleware(tokenService);
  router.use(authGuard);

  // Static / parameterized queries (before /:id)
  router.get('/reports/outstanding', controller.getOutstandingInvoicesReportHandler);
  router.get('/customer/:customerId/summary', controller.getCustomerInvoiceSummaryHandler);
  router.get('/customer/:customerId', controller.getCustomerInvoicesHandler);

  // Sub-resource routes
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

  router.get('/customer/:customerId', controller.getCustomerPaymentsHandler);
  router.post('/:id/cancel', controller.cancelPaymentHandler);

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
