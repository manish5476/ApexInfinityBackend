import { Router } from 'express';
import { Connection } from 'mongoose';
import { AccountingController } from './presentation/controllers/accounting.controller';
import { EmiController } from './presentation/controllers/emi.controller';
import { ReconciliationController } from './presentation/controllers/reconciliation.controller';
import { TransactionController } from './presentation/controllers/transaction.controller';
import { InvoicePDFController } from './presentation/controllers/invoicePDF.controller';
import {
  createAccountingRoutes,
  createInvoiceRoutes,
  createPaymentRoutes,
  createAccountRoutes,
  createLedgerRoutes,
} from './presentation/routes/accounting.routes';
import { createEmiRoutes } from './presentation/routes/emi.routes';
import { createStatementRoutes } from './presentation/routes/statements.routes';
import { createReconciliationRoutes } from './presentation/routes/reconciliation.routes';
import { createTransactionRoutes } from './presentation/routes/transaction.routes';
import { createPartyTransactionRoutes } from './presentation/routes/partyTransaction.routes';
import { createInvoicePdfRoutes } from './presentation/routes/invoicePDF.routes';
import { getEmiModel } from './infrastructure/persistence/emi.model';
import { getPendingReconciliationModel } from './infrastructure/persistence/reconciliation.model';
import { AccountEntryModel } from './infrastructure/persistence/accountEntry.model';
import { MongoInvoiceRepository } from './infrastructure/repositories/MongoInvoiceRepository';
import { MongoPaymentRepository } from './infrastructure/repositories/MongoPaymentRepository';
import { MongoAccountRepository } from './infrastructure/repositories/MongoAccountRepository';
import { MongoAccountEntryRepository } from './infrastructure/repositories/MongoAccountEntryRepository';
import { IInvoiceRepository } from './domain/ports/IInvoiceRepository';
import { IPaymentRepository } from './domain/ports/IPaymentRepository';
import { IAccountRepository } from './domain/ports/IAccountRepository';
import { IAccountEntryRepository } from './domain/ports/IAccountEntryRepository';
import { CreateInvoiceUseCase } from './application/use-cases/CreateInvoiceUseCase';
import { ListInvoicesUseCase } from './application/use-cases/ListInvoicesUseCase';
import { GetInvoiceByIdUseCase } from './application/use-cases/GetInvoiceByIdUseCase';
import { UpdateInvoiceUseCase } from './application/use-cases/UpdateInvoiceUseCase';
import { CancelInvoiceUseCase } from './application/use-cases/CancelInvoiceUseCase';
import { DeleteInvoiceUseCase } from './application/use-cases/DeleteInvoiceUseCase';
import { RestoreInvoiceUseCase } from './application/use-cases/RestoreInvoiceUseCase';
import { GetCustomerInvoicesUseCase } from './application/use-cases/GetCustomerInvoicesUseCase';
import { GetCustomerInvoiceSummaryUseCase } from './application/use-cases/GetCustomerInvoiceSummaryUseCase';
import { GetOutstandingInvoicesReportUseCase } from './application/use-cases/GetOutstandingInvoicesReportUseCase';
import { RecordPaymentUseCase } from './application/use-cases/RecordPaymentUseCase';
import { CreatePaymentUseCase } from './application/use-cases/CreatePaymentUseCase';
import { ListPaymentsUseCase } from './application/use-cases/ListPaymentsUseCase';
import { GetPaymentByIdUseCase } from './application/use-cases/GetPaymentByIdUseCase';
import { CancelPaymentUseCase } from './application/use-cases/CancelPaymentUseCase';
import { GetCustomerPaymentsUseCase } from './application/use-cases/GetCustomerPaymentsUseCase';
import { CreateAccountUseCase } from './application/use-cases/CreateAccountUseCase';
import { ListAccountsUseCase } from './application/use-cases/ListAccountsUseCase';
import { GetAccountByIdUseCase } from './application/use-cases/GetAccountByIdUseCase';
import { UpdateAccountUseCase } from './application/use-cases/UpdateAccountUseCase';
import { ReparentAccountUseCase } from './application/use-cases/ReparentAccountUseCase';
import { GetAccountHierarchyUseCase } from './application/use-cases/GetAccountHierarchyUseCase';
import { DeleteAccountUseCase } from './application/use-cases/DeleteAccountUseCase';
import { ListLedgerEntriesUseCase } from './application/use-cases/ListLedgerEntriesUseCase';
import { GetTrialBalanceUseCase } from './application/use-cases/GetTrialBalanceUseCase';
import { GetProfitLossUseCase } from './application/use-cases/GetProfitLossUseCase';
import { GetBalanceSheetUseCase } from './application/use-cases/GetBalanceSheetUseCase';
import { ITokenService } from '../../infrastructure/security/ITokenService';
import { IEventBus } from '../../infrastructure/messaging/IEventBus';
import { IEmailSender } from '../../infrastructure/email/IEmailSender';
import { IUnitOfWork } from '../../core/application/IUnitOfWork';
import { MongoUnitOfWork } from '../../infrastructure/database/MongoUnitOfWork';

export interface AccountingModule {
  routes: Router;
  invoiceRoutes: Router;
  invoicePdfRoutes: Router;
  paymentRoutes: Router;
  accountRoutes: Router;
  ledgerRoutes: Router;
  emiRoutes: Router;
  statementRoutes: Router;
  reconciliationRoutes: Router;
  transactionRoutes: Router;
  partyTransactionRoutes: Router;
  invoiceRepo: IInvoiceRepository;
  paymentRepo: IPaymentRepository;
  accountRepo: IAccountRepository;
  accountEntryRepo: IAccountEntryRepository;
}

export function createAccountingModule(deps: {
  connection: Connection;
  tokenService: ITokenService;
  eventBus: IEventBus;
  emailSender?: IEmailSender;
  uow?: IUnitOfWork;
}): AccountingModule {
  const uow: IUnitOfWork = deps.uow || new MongoUnitOfWork(deps.connection);

  // Repositories & Models
  const invoiceRepo = new MongoInvoiceRepository();
  const paymentRepo = new MongoPaymentRepository();
  const accountRepo = new MongoAccountRepository();
  const accountEntryRepo = new MongoAccountEntryRepository();
  const emiModel = getEmiModel(deps.connection);
  const pendingModel = getPendingReconciliationModel(deps.connection);

  // Invoice Use Cases
  const createInvoiceUC = new CreateInvoiceUseCase(invoiceRepo, deps.eventBus, uow);
  const listInvoicesUC = new ListInvoicesUseCase(invoiceRepo);
  const getInvoiceByIdUC = new GetInvoiceByIdUseCase(invoiceRepo);
  const updateInvoiceUC = new UpdateInvoiceUseCase(invoiceRepo);
  const cancelInvoiceUC = new CancelInvoiceUseCase(invoiceRepo);
  const deleteInvoiceUC = new DeleteInvoiceUseCase(invoiceRepo);
  const restoreInvoiceUC = new RestoreInvoiceUseCase(invoiceRepo);
  const getCustomerInvoicesUC = new GetCustomerInvoicesUseCase(invoiceRepo);
  const getCustomerInvoiceSummaryUC = new GetCustomerInvoiceSummaryUseCase(invoiceRepo);
  const getOutstandingReportUC = new GetOutstandingInvoicesReportUseCase(invoiceRepo);

  // Payment Use Cases
  const recordPaymentUC = new RecordPaymentUseCase(invoiceRepo, paymentRepo, deps.eventBus, uow);
  const createPaymentUC = new CreatePaymentUseCase(paymentRepo, invoiceRepo, deps.eventBus, uow);
  const listPaymentsUC = new ListPaymentsUseCase(paymentRepo);
  const getPaymentByIdUC = new GetPaymentByIdUseCase(paymentRepo);
  const cancelPaymentUC = new CancelPaymentUseCase(paymentRepo);
  const getCustomerPaymentsUC = new GetCustomerPaymentsUseCase(paymentRepo);

  // Account Use Cases
  const createAccountUC = new CreateAccountUseCase(accountRepo);
  const listAccountsUC = new ListAccountsUseCase(accountRepo);
  const getAccountByIdUC = new GetAccountByIdUseCase(accountRepo);
  const updateAccountUC = new UpdateAccountUseCase(accountRepo);
  const reparentAccountUC = new ReparentAccountUseCase(accountRepo);
  const getAccountHierarchyUC = new GetAccountHierarchyUseCase(accountRepo);
  const deleteAccountUC = new DeleteAccountUseCase(accountRepo);

  // Ledger Use Cases
  const listLedgerEntriesUC = new ListLedgerEntriesUseCase(accountEntryRepo);
  const getTrialBalanceUC = new GetTrialBalanceUseCase(accountEntryRepo, accountRepo);
  const getProfitLossUC = new GetProfitLossUseCase(accountEntryRepo, accountRepo);
  const getBalanceSheetUC = new GetBalanceSheetUseCase(accountEntryRepo, accountRepo);

  // Controllers
  const controller = new AccountingController(
    createInvoiceUC,
    listInvoicesUC,
    getInvoiceByIdUC,
    updateInvoiceUC,
    cancelInvoiceUC,
    deleteInvoiceUC,
    restoreInvoiceUC,
    getCustomerInvoicesUC,
    getCustomerInvoiceSummaryUC,
    getOutstandingReportUC,
    recordPaymentUC,
    createPaymentUC,
    listPaymentsUC,
    getPaymentByIdUC,
    cancelPaymentUC,
    getCustomerPaymentsUC,
    createAccountUC,
    listAccountsUC,
    getAccountByIdUC,
    updateAccountUC,
    reparentAccountUC,
    getAccountHierarchyUC,
    deleteAccountUC,
    listLedgerEntriesUC,
    getTrialBalanceUC,
    getProfitLossUC,
    getBalanceSheetUC,
    paymentRepo,
  );

  const emiController = new EmiController(emiModel);
  const reconciliationController = new ReconciliationController(pendingModel, emiModel);
  const transactionController = new TransactionController(AccountEntryModel);
  const fallbackEmailSender: IEmailSender = deps.emailSender || { send: async () => {} };
  const invoicePdfController = new InvoicePDFController(invoiceRepo, fallbackEmailSender);

  // Routes
  const routes = createAccountingRoutes(controller, deps.tokenService);
  const invoiceRoutes = createInvoiceRoutes(controller, deps.tokenService);
  const invoicePdfRoutes = createInvoicePdfRoutes(invoicePdfController, deps.tokenService);
  const paymentRoutes = createPaymentRoutes(controller, deps.tokenService);
  const accountRoutes = createAccountRoutes(controller, deps.tokenService);
  const ledgerRoutes = createLedgerRoutes(controller, deps.tokenService);
  const emiRoutes = createEmiRoutes(emiController, deps.tokenService);
  const statementRoutes = createStatementRoutes(controller, deps.tokenService);
  const reconciliationRoutes = createReconciliationRoutes(reconciliationController, deps.tokenService);
  const transactionRoutes = createTransactionRoutes(transactionController, deps.tokenService);
  const partyTransactionRoutes = createPartyTransactionRoutes(transactionController, deps.tokenService);

  return {
    routes,
    invoiceRoutes,
    invoicePdfRoutes,
    paymentRoutes,
    accountRoutes,
    ledgerRoutes,
    emiRoutes,
    statementRoutes,
    reconciliationRoutes,
    transactionRoutes,
    partyTransactionRoutes,
    invoiceRepo,
    paymentRepo,
    accountRepo,
    accountEntryRepo,
  };
}
