import { Router } from 'express';
import { Connection } from 'mongoose';
import { AccountingController } from './presentation/controllers/accounting.controller';
import {
  createAccountingRoutes,
  createInvoiceRoutes,
  createPaymentRoutes,
  createAccountRoutes,
  createLedgerRoutes,
} from './presentation/routes/accounting.routes';
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
import { IUnitOfWork } from '../../core/application/IUnitOfWork';
import { MongoUnitOfWork } from '../../infrastructure/database/MongoUnitOfWork';

export interface AccountingModule {
  routes: Router;
  invoiceRoutes: Router;
  paymentRoutes: Router;
  accountRoutes: Router;
  ledgerRoutes: Router;
  invoiceRepo: IInvoiceRepository;
  paymentRepo: IPaymentRepository;
  accountRepo: IAccountRepository;
  accountEntryRepo: IAccountEntryRepository;
}

export function createAccountingModule(deps: {
  connection: Connection;
  tokenService: ITokenService;
  eventBus: IEventBus;
  uow?: IUnitOfWork;
}): AccountingModule {
  const uow: IUnitOfWork = deps.uow || new MongoUnitOfWork(deps.connection);

  // Repositories
  const invoiceRepo = new MongoInvoiceRepository();
  const paymentRepo = new MongoPaymentRepository();
  const accountRepo = new MongoAccountRepository();
  const accountEntryRepo = new MongoAccountEntryRepository();

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

  // Controller
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

  // Routes
  const routes = createAccountingRoutes(controller, deps.tokenService);
  const invoiceRoutes = createInvoiceRoutes(controller, deps.tokenService);
  const paymentRoutes = createPaymentRoutes(controller, deps.tokenService);
  const accountRoutes = createAccountRoutes(controller, deps.tokenService);
  const ledgerRoutes = createLedgerRoutes(controller, deps.tokenService);

  return {
    routes,
    invoiceRoutes,
    paymentRoutes,
    accountRoutes,
    ledgerRoutes,
    invoiceRepo,
    paymentRepo,
    accountRepo,
    accountEntryRepo,
  };
}
