import { Request, Response, NextFunction } from 'express';
import { CreateInvoiceUseCase } from '../../application/use-cases/CreateInvoiceUseCase';
import { ListInvoicesUseCase } from '../../application/use-cases/ListInvoicesUseCase';
import { GetInvoiceByIdUseCase } from '../../application/use-cases/GetInvoiceByIdUseCase';
import { UpdateInvoiceUseCase } from '../../application/use-cases/UpdateInvoiceUseCase';
import { CancelInvoiceUseCase } from '../../application/use-cases/CancelInvoiceUseCase';
import { DeleteInvoiceUseCase } from '../../application/use-cases/DeleteInvoiceUseCase';
import { RestoreInvoiceUseCase } from '../../application/use-cases/RestoreInvoiceUseCase';
import { GetCustomerInvoicesUseCase } from '../../application/use-cases/GetCustomerInvoicesUseCase';
import { GetCustomerInvoiceSummaryUseCase } from '../../application/use-cases/GetCustomerInvoiceSummaryUseCase';
import { GetOutstandingInvoicesReportUseCase } from '../../application/use-cases/GetOutstandingInvoicesReportUseCase';
import { RecordPaymentUseCase } from '../../application/use-cases/RecordPaymentUseCase';
import { CreatePaymentUseCase } from '../../application/use-cases/CreatePaymentUseCase';
import { ListPaymentsUseCase } from '../../application/use-cases/ListPaymentsUseCase';
import { GetPaymentByIdUseCase } from '../../application/use-cases/GetPaymentByIdUseCase';
import { CancelPaymentUseCase } from '../../application/use-cases/CancelPaymentUseCase';
import { GetCustomerPaymentsUseCase } from '../../application/use-cases/GetCustomerPaymentsUseCase';
import { CreateAccountUseCase } from '../../application/use-cases/CreateAccountUseCase';
import { ListAccountsUseCase } from '../../application/use-cases/ListAccountsUseCase';
import { GetAccountByIdUseCase } from '../../application/use-cases/GetAccountByIdUseCase';
import { UpdateAccountUseCase } from '../../application/use-cases/UpdateAccountUseCase';
import { ReparentAccountUseCase } from '../../application/use-cases/ReparentAccountUseCase';
import { GetAccountHierarchyUseCase } from '../../application/use-cases/GetAccountHierarchyUseCase';
import { DeleteAccountUseCase } from '../../application/use-cases/DeleteAccountUseCase';
import { ListLedgerEntriesUseCase } from '../../application/use-cases/ListLedgerEntriesUseCase';
import { GetTrialBalanceUseCase } from '../../application/use-cases/GetTrialBalanceUseCase';
import { GetProfitLossUseCase } from '../../application/use-cases/GetProfitLossUseCase';
import { GetBalanceSheetUseCase } from '../../application/use-cases/GetBalanceSheetUseCase';
import { IPaymentRepository } from '../../domain/ports/IPaymentRepository';
import { AccountingMapper } from '../../application/mappers/AccountingMapper';
import { RequestContextHolder } from '../../../../middleware/requestContext.middleware';
import { AccountType } from '../../domain/value-objects/AccountingEnums';

export class AccountingController {
  constructor(
    private readonly createInvoiceUC: CreateInvoiceUseCase,
    private readonly listInvoicesUC: ListInvoicesUseCase,
    private readonly getInvoiceByIdUC: GetInvoiceByIdUseCase,
    private readonly updateInvoiceUC: UpdateInvoiceUseCase,
    private readonly cancelInvoiceUC: CancelInvoiceUseCase,
    private readonly deleteInvoiceUC: DeleteInvoiceUseCase,
    private readonly restoreInvoiceUC: RestoreInvoiceUseCase,
    private readonly getCustomerInvoicesUC: GetCustomerInvoicesUseCase,
    private readonly getCustomerInvoiceSummaryUC: GetCustomerInvoiceSummaryUseCase,
    private readonly getOutstandingReportUC: GetOutstandingInvoicesReportUseCase,
    private readonly recordPaymentUC: RecordPaymentUseCase,
    private readonly createPaymentUC: CreatePaymentUseCase,
    private readonly listPaymentsUC: ListPaymentsUseCase,
    private readonly getPaymentByIdUC: GetPaymentByIdUseCase,
    private readonly cancelPaymentUC: CancelPaymentUseCase,
    private readonly getCustomerPaymentsUC: GetCustomerPaymentsUseCase,
    private readonly createAccountUC: CreateAccountUseCase,
    private readonly listAccountsUC: ListAccountsUseCase,
    private readonly getAccountByIdUC: GetAccountByIdUseCase,
    private readonly updateAccountUC: UpdateAccountUseCase,
    private readonly reparentAccountUC: ReparentAccountUseCase,
    private readonly getAccountHierarchyUC: GetAccountHierarchyUseCase,
    private readonly deleteAccountUC: DeleteAccountUseCase,
    private readonly listLedgerEntriesUC: ListLedgerEntriesUseCase,
    private readonly getTrialBalanceUC: GetTrialBalanceUseCase,
    private readonly getProfitLossUC: GetProfitLossUseCase,
    private readonly getBalanceSheetUC: GetBalanceSheetUseCase,
    private readonly paymentRepo: IPaymentRepository,
  ) {}

  // ----------------- Invoices -----------------

  public createInvoiceHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ctx = RequestContextHolder.get()!;
      const result = await this.createInvoiceUC.execute(
        { ...req.body, dueDate: req.body.dueDate ? new Date(req.body.dueDate) : undefined, createdBy: ctx.userId },
        { organizationId: ctx.organizationId! }
      );
      res.status(201).json({ status: 'success', data: result });
    } catch (err) { next(err); }
  };

  public listInvoicesHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ctx = RequestContextHolder.get()!;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const isDeleted = req.query.isDeleted !== undefined ? req.query.isDeleted === 'true' : undefined;
      const result = await this.listInvoicesUC.execute(
        {
          page,
          limit,
          status: (req.query.status as string) || null,
          paymentStatus: (req.query.paymentStatus as string) || null,
          customerId: (req.query.customerId as string) || null,
          branchId: (req.query.branchId as string) || undefined,
          search: (req.query.search as string) || undefined,
          isDeleted,
        },
        { organizationId: ctx.organizationId! }
      );
      res.status(200).json({ status: 'success', data: result.data, total: result.total });
    } catch (err) { next(err); }
  };

  public getInvoiceByIdHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ctx = RequestContextHolder.get()!;
      const result = await this.getInvoiceByIdUC.execute({ id: req.params.id as string }, { organizationId: ctx.organizationId! });
      res.status(200).json({ status: 'success', data: result });
    } catch (err) { next(err); }
  };

  public updateInvoiceHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ctx = RequestContextHolder.get()!;
      const result = await this.updateInvoiceUC.execute(
        { id: req.params.id as string, data: req.body },
        { organizationId: ctx.organizationId! }
      );
      res.status(200).json({ status: 'success', data: result });
    } catch (err) { next(err); }
  };

  public cancelInvoiceHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ctx = RequestContextHolder.get()!;
      const result = await this.cancelInvoiceUC.execute({ id: req.params.id as string }, { organizationId: ctx.organizationId! });
      res.status(200).json({ status: 'success', data: result });
    } catch (err) { next(err); }
  };

  public deleteInvoiceHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ctx = RequestContextHolder.get()!;
      const result = await this.deleteInvoiceUC.execute({ id: req.params.id as string }, { organizationId: ctx.organizationId! });
      res.status(200).json({ status: 'success', ...result });
    } catch (err) { next(err); }
  };

  public restoreInvoiceHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ctx = RequestContextHolder.get()!;
      const result = await this.restoreInvoiceUC.execute({ id: req.params.id as string }, { organizationId: ctx.organizationId! });
      res.status(200).json({ status: 'success', data: result });
    } catch (err) { next(err); }
  };

  public getCustomerInvoicesHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ctx = RequestContextHolder.get()!;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const result = await this.getCustomerInvoicesUC.execute(
        { customerId: req.params.customerId as string, limit },
        { organizationId: ctx.organizationId! }
      );
      res.status(200).json({ status: 'success', data: result });
    } catch (err) { next(err); }
  };

  public getCustomerInvoiceSummaryHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ctx = RequestContextHolder.get()!;
      const result = await this.getCustomerInvoiceSummaryUC.execute(
        { customerId: req.params.customerId as string },
        { organizationId: ctx.organizationId! }
      );
      res.status(200).json({ status: 'success', data: result });
    } catch (err) { next(err); }
  };

  public getInvoicePaymentsHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ctx = RequestContextHolder.get()!;
      const payments = await this.paymentRepo.findByInvoiceId({
        invoiceId: req.params.id as string,
        organizationId: ctx.organizationId!,
      });
      res.status(200).json({ status: 'success', data: payments.map(p => AccountingMapper.toPaymentDto(p)) });
    } catch (err) { next(err); }
  };

  public recordPaymentHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ctx = RequestContextHolder.get()!;
      const invoiceId = (req.params.id as string) || (req.params.invoiceId as string) || req.body.invoiceId;
      const result = await this.recordPaymentUC.execute(
        { invoiceId, ...req.body, createdBy: ctx.userId },
        { organizationId: ctx.organizationId! }
      );
      res.status(200).json({ status: 'success', data: result });
    } catch (err) { next(err); }
  };

  public getOutstandingInvoicesReportHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ctx = RequestContextHolder.get()!;
      const customerId = (req.query.customerId as string) || undefined;
      const result = await this.getOutstandingReportUC.execute({ customerId }, { organizationId: ctx.organizationId! });
      res.status(200).json({ status: 'success', ...result });
    } catch (err) { next(err); }
  };

  // ----------------- Payments -----------------

  public createPaymentHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ctx = RequestContextHolder.get()!;
      const result = await this.createPaymentUC.execute(req.body, { organizationId: ctx.organizationId! });
      res.status(201).json({ status: 'success', data: result });
    } catch (err) { next(err); }
  };

  public listPaymentsHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ctx = RequestContextHolder.get()!;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const result = await this.listPaymentsUC.execute(
        {
          page,
          limit,
          customerId: (req.query.customerId as string) || undefined,
          supplierId: (req.query.supplierId as string) || undefined,
          invoiceId: (req.query.invoiceId as string) || undefined,
          branchId: (req.query.branchId as string) || undefined,
          status: (req.query.status as string) || undefined,
        },
        { organizationId: ctx.organizationId! }
      );
      res.status(200).json({ status: 'success', data: result.data, total: result.total });
    } catch (err) { next(err); }
  };

  public getPaymentByIdHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ctx = RequestContextHolder.get()!;
      const result = await this.getPaymentByIdUC.execute({ id: req.params.id as string }, { organizationId: ctx.organizationId! });
      res.status(200).json({ status: 'success', data: result });
    } catch (err) { next(err); }
  };

  public cancelPaymentHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ctx = RequestContextHolder.get()!;
      const result = await this.cancelPaymentUC.execute({ id: req.params.id as string }, { organizationId: ctx.organizationId! });
      res.status(200).json({ status: 'success', data: result });
    } catch (err) { next(err); }
  };

  public getCustomerPaymentsHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ctx = RequestContextHolder.get()!;
      const result = await this.getCustomerPaymentsUC.execute(
        { customerId: req.params.customerId as string },
        { organizationId: ctx.organizationId! }
      );
      res.status(200).json({ status: 'success', data: result });
    } catch (err) { next(err); }
  };

  // ----------------- Accounts -----------------

  public createAccountHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ctx = RequestContextHolder.get()!;
      const result = await this.createAccountUC.execute(req.body, { organizationId: ctx.organizationId! });
      res.status(201).json({ status: 'success', data: result });
    } catch (err) { next(err); }
  };

  public listAccountsHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ctx = RequestContextHolder.get()!;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const isGroup = req.query.isGroup !== undefined ? req.query.isGroup === 'true' : undefined;
      const isActive = req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined;
      const result = await this.listAccountsUC.execute(
        {
          page,
          limit,
          type: (req.query.type as AccountType) || undefined,
          parent: req.query.parent !== undefined ? (req.query.parent as string) : undefined,
          isGroup,
          isActive,
        },
        { organizationId: ctx.organizationId! }
      );
      res.status(200).json({ status: 'success', data: result.data, total: result.total });
    } catch (err) { next(err); }
  };

  public getAccountByIdHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ctx = RequestContextHolder.get()!;
      const result = await this.getAccountByIdUC.execute({ id: req.params.id as string }, { organizationId: ctx.organizationId! });
      res.status(200).json({ status: 'success', data: result });
    } catch (err) { next(err); }
  };

  public updateAccountHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ctx = RequestContextHolder.get()!;
      const result = await this.updateAccountUC.execute(
        { id: req.params.id as string, data: req.body },
        { organizationId: ctx.organizationId! }
      );
      res.status(200).json({ status: 'success', data: result });
    } catch (err) { next(err); }
  };

  public reparentAccountHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ctx = RequestContextHolder.get()!;
      const result = await this.reparentAccountUC.execute(
        { id: req.params.id as string, newParentId: req.body.newParentId },
        { organizationId: ctx.organizationId! }
      );
      res.status(200).json({ status: 'success', data: result });
    } catch (err) { next(err); }
  };

  public getAccountHierarchyHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ctx = RequestContextHolder.get()!;
      const result = await this.getAccountHierarchyUC.execute({ organizationId: ctx.organizationId! });
      res.status(200).json({ status: 'success', data: result });
    } catch (err) { next(err); }
  };

  public deleteAccountHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ctx = RequestContextHolder.get()!;
      const result = await this.deleteAccountUC.execute({ id: req.params.id as string }, { organizationId: ctx.organizationId! });
      res.status(200).json({ status: 'success', ...result });
    } catch (err) { next(err); }
  };

  // ----------------- Ledgers -----------------

  public listLedgerEntriesHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ctx = RequestContextHolder.get()!;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const fromDate = req.query.fromDate ? new Date(req.query.fromDate as string) : undefined;
      const toDate = req.query.toDate ? new Date(req.query.toDate as string) : undefined;
      const result = await this.listLedgerEntriesUC.execute(
        {
          page,
          limit,
          accountId: (req.query.accountId as string) || undefined,
          customerId: (req.query.customerId as string) || undefined,
          supplierId: (req.query.supplierId as string) || undefined,
          invoiceId: (req.query.invoiceId as string) || undefined,
          paymentId: (req.query.paymentId as string) || undefined,
          referenceNumber: (req.query.referenceNumber as string) || undefined,
          referenceType: (req.query.referenceType as string) || undefined,
          fromDate,
          toDate,
        },
        { organizationId: ctx.organizationId! }
      );
      res.status(200).json({ status: 'success', data: result.data, total: result.total });
    } catch (err) { next(err); }
  };

  public getTrialBalanceHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ctx = RequestContextHolder.get()!;
      const fromDate = req.query.fromDate ? new Date(req.query.fromDate as string) : undefined;
      const toDate = req.query.toDate ? new Date(req.query.toDate as string) : undefined;
      const result = await this.getTrialBalanceUC.execute({ fromDate, toDate }, { organizationId: ctx.organizationId! });
      res.status(200).json({ status: 'success', data: result });
    } catch (err) { next(err); }
  };

  public getProfitLossHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ctx = RequestContextHolder.get()!;
      const fromDate = req.query.fromDate ? new Date(req.query.fromDate as string) : undefined;
      const toDate = req.query.toDate ? new Date(req.query.toDate as string) : undefined;
      const result = await this.getProfitLossUC.execute({ fromDate, toDate }, { organizationId: ctx.organizationId! });
      res.status(200).json({ status: 'success', data: result });
    } catch (err) { next(err); }
  };

  public getBalanceSheetHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ctx = RequestContextHolder.get()!;
      const asOfDate = req.query.asOfDate ? new Date(req.query.asOfDate as string) : undefined;
      const result = await this.getBalanceSheetUC.execute({ asOfDate }, { organizationId: ctx.organizationId! });
      res.status(200).json({ status: 'success', data: result });
    } catch (err) { next(err); }
  };

  public getCustomerLedgerHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ctx = RequestContextHolder.get()!;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const result = await this.listLedgerEntriesUC.execute(
        { customerId: req.params.customerId as string, page, limit },
        { organizationId: ctx.organizationId! }
      );
      res.status(200).json({ status: 'success', data: result.data, total: result.total });
    } catch (err) { next(err); }
  };

  public getAccountLedgerHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ctx = RequestContextHolder.get()!;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const result = await this.listLedgerEntriesUC.execute(
        { accountId: req.params.accountId as string, page, limit },
        { organizationId: ctx.organizationId! }
      );
      res.status(200).json({ status: 'success', data: result.data, total: result.total });
    } catch (err) { next(err); }
  };
}
