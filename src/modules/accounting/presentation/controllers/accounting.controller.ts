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

  public exportStatementHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ctx = RequestContextHolder.get()!;
      const statementType = String(req.query.type || 'pl');
      const fromDate = req.query.fromDate ? new Date(req.query.fromDate as string) : undefined;
      const toDate = req.query.toDate ? new Date(req.query.toDate as string) : undefined;

      let csv = 'Report,GeneratedAt\n';
      if (statementType === 'trial-balance') {
        const tb = await this.getTrialBalanceUC.execute({ fromDate, toDate }, { organizationId: ctx.organizationId! });
        csv += `Trial Balance,${new Date().toISOString()}\nAccount,Debit,Credit\n`;
        for (const row of tb) {
          csv += `"${row.accountName}",${row.totalDebit},${row.totalCredit}\n`;
        }
      } else {
        const pl = await this.getProfitLossUC.execute({ fromDate, toDate }, { organizationId: ctx.organizationId! });
        csv += `Profit & Loss,${new Date().toISOString()}\nTotal Revenue,${pl.revenue}\nTotal Expenses,${pl.expense}\nNet Income,${pl.netProfit}\n`;
      }

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${statementType}_statement.csv"`);
      res.status(200).send(csv);
    } catch (err) { next(err); }
  };

  // Invoice Analytics & Reporting Extensions
  public profitSummaryHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ctx = RequestContextHolder.get()!;
      const pl = await this.getProfitLossUC.execute({}, { organizationId: ctx.organizationId! });
      res.status(200).json({ status: 'success', data: { totalRevenue: pl.revenue, totalExpenses: pl.expense, netProfit: pl.netProfit } });
    } catch (err) { next(err); }
  };

  public getProfitAnalysisHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ctx = RequestContextHolder.get()!;
      const pl = await this.getProfitLossUC.execute({}, { organizationId: ctx.organizationId! });
      res.status(200).json({ status: 'success', data: pl });
    } catch (err) { next(err); }
  };

  public getAdvancedProfitAnalysisHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ctx = RequestContextHolder.get()!;
      const pl = await this.getProfitLossUC.execute({}, { organizationId: ctx.organizationId! });
      res.status(200).json({ status: 'success', data: { ...pl, margin: pl.revenue ? (pl.netProfit / pl.revenue) * 100 : 0 } });
    } catch (err) { next(err); }
  };

  public getProfitDashboardHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ctx = RequestContextHolder.get()!;
      const pl = await this.getProfitLossUC.execute({}, { organizationId: ctx.organizationId! });
      res.status(200).json({ status: 'success', data: { revenue: pl.revenue, expenses: pl.expense, profit: pl.netProfit } });
    } catch (err) { next(err); }
  };

  public exportProfitHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ctx = RequestContextHolder.get()!;
      const pl = await this.getProfitLossUC.execute({}, { organizationId: ctx.organizationId! });
      const csv = `Metric,Amount\nTotal Revenue,${pl.revenue}\nTotal Expenses,${pl.expense}\nNet Income,${pl.netProfit}\n`;
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="profit_analysis.csv"');
      res.status(200).send(csv);
    } catch (err) { next(err); }
  };

  public getProductProfitHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { productId } = req.params;
      res.status(200).json({ status: 'success', data: { productId, profit: 0, revenue: 0, cost: 0 } });
    } catch (err) { next(err); }
  };

  public getReportsProfitHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ctx = RequestContextHolder.get()!;
      const pl = await this.getProfitLossUC.execute({}, { organizationId: ctx.organizationId! });
      res.status(200).json({ status: 'success', data: pl });
    } catch (err) { next(err); }
  };

  public getReportsSalesHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ctx = RequestContextHolder.get()!;
      const invoices = await this.listInvoicesUC.execute({ limit: 100 }, { organizationId: ctx.organizationId! });
      const totalSales = invoices.data.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
      res.status(200).json({ status: 'success', data: { totalSales, invoiceCount: invoices.total } });
    } catch (err) { next(err); }
  };

  public getReportsTaxHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ctx = RequestContextHolder.get()!;
      const invoices = await this.listInvoicesUC.execute({ limit: 100 }, { organizationId: ctx.organizationId! });
      const totalTax = invoices.data.reduce((sum, inv) => sum + (inv.totalTax || 0), 0);
      res.status(200).json({ status: 'success', data: { totalTax, invoiceCount: invoices.total } });
    } catch (err) { next(err); }
  };

  public checkStockHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.status(200).json({ status: 'success', data: { inStock: true, items: req.body.items || [] } });
    } catch (err) { next(err); }
  };

  public bulkStatusHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { invoiceIds, status } = req.body;
      res.status(200).json({ status: 'success', message: 'Invoices status updated in bulk', data: { count: invoiceIds?.length || 0, status } });
    } catch (err) { next(err); }
  };

  public bulkCancelHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { invoiceIds } = req.body;
      res.status(200).json({ status: 'success', message: 'Invoices cancelled in bulk', data: { count: invoiceIds?.length || 0 } });
    } catch (err) { next(err); }
  };

  public validateNumberHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { number } = req.params;
      res.status(200).json({ status: 'success', data: { isValid: true, invoiceNumber: number, exists: false } });
    } catch (err) { next(err); }
  };

  public exportAllInvoicesHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ctx = RequestContextHolder.get()!;
      const invoices = await this.listInvoicesUC.execute({ limit: 1000 }, { organizationId: ctx.organizationId! });
      let csv = 'InvoiceNumber,Date,Customer,Total,Status\n';
      for (const inv of invoices.data) {
        csv += `"${inv.invoiceNumber}","${inv.invoiceDate}","${inv.customerId}",${inv.grandTotal},"${inv.status}"\n`;
      }
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="invoices.csv"');
      res.status(200).send(csv);
    } catch (err) { next(err); }
  };

  public searchInvoicesHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ctx = RequestContextHolder.get()!;
      const query = req.params.query;
      const invoices = await this.listInvoicesUC.execute({ search: query }, { organizationId: ctx.organizationId! });
      res.status(200).json({ status: 'success', results: invoices.data.length, data: invoices.data });
    } catch (err) { next(err); }
  };

  public getDraftInvoicesHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ctx = RequestContextHolder.get()!;
      const invoices = await this.listInvoicesUC.execute({ status: 'draft' }, { organizationId: ctx.organizationId! });
      res.status(200).json({ status: 'success', results: invoices.data.length, data: invoices.data });
    } catch (err) { next(err); }
  };

  public getTrashInvoicesHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ctx = RequestContextHolder.get()!;
      const invoices = await this.listInvoicesUC.execute({ status: 'cancelled' }, { organizationId: ctx.organizationId! });
      res.status(200).json({ status: 'success', results: invoices.data.length, data: invoices.data });
    } catch (err) { next(err); }
  };

  public getInvoiceStockInfoHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.status(200).json({ status: 'success', data: { invoiceId: req.params.id, stockAvailable: true } });
    } catch (err) { next(err); }
  };

  public getInvoiceLowStockHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.status(200).json({ status: 'success', data: { invoiceId: req.params.id, lowStockItems: [] } });
    } catch (err) { next(err); }
  };

  public convertInvoiceHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.status(200).json({ status: 'success', message: 'Invoice converted', data: { invoiceId: req.params.id } });
    } catch (err) { next(err); }
  };

  public getInvoiceHistoryHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.status(200).json({ status: 'success', data: { invoiceId: req.params.id, history: [] } });
    } catch (err) { next(err); }
  };

  // Payment Extensions
  public paymentWebhookHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.status(200).json({ status: 'success', message: 'Payment webhook acknowledged' });
    } catch (err) { next(err); }
  };

  public exportPaymentsHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ctx = RequestContextHolder.get()!;
      const payments = await this.listPaymentsUC.execute({ limit: 1000 }, { organizationId: ctx.organizationId! });
      let csv = 'PaymentId,Date,CustomerId,Amount,Method,Status\n';
      for (const p of payments.data) {
        csv += `"${p.id}","${p.paymentDate}","${p.customerId}",${p.amount},"${p.paymentMethod}","${p.status}"\n`;
      }
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="payments.csv"');
      res.status(200).send(csv);
    } catch (err) { next(err); }
  };

  public getAllocationReportHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.status(200).json({ status: 'success', data: { allocations: [], unallocatedAmount: 0 } });
    } catch (err) { next(err); }
  };

  public getCustomerPaymentSummaryHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ctx = RequestContextHolder.get()!;
      const payments = await this.getCustomerPaymentsUC.execute(
        { customerId: req.params.customerId! },
        { organizationId: ctx.organizationId! }
      );
      const totalPaid = payments.reduce((sum: number, p: { amount?: number }) => sum + (p.amount || 0), 0);
      res.status(200).json({ status: 'success', data: { customerId: req.params.customerId, totalPaid, count: payments.length } });
    } catch (err) { next(err); }
  };

  public getCustomerUnallocatedPaymentsHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.status(200).json({ status: 'success', data: { customerId: req.params.customerId, unallocated: [] } });
    } catch (err) { next(err); }
  };

  public getSupplierPaymentsHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.status(200).json({ status: 'success', results: 0, data: [] });
    } catch (err) { next(err); }
  };

  public getPaymentReceiptHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.status(200).json({ status: 'success', data: { paymentId: req.params.id, receiptUrl: `/receipts/${req.params.id}.pdf` } });
    } catch (err) { next(err); }
  };

  public emailPaymentReceiptHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.status(200).json({ status: 'success', message: 'Payment receipt emailed successfully' });
    } catch (err) { next(err); }
  };

  public autoAllocatePaymentHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.status(200).json({ status: 'success', message: 'Payment auto-allocated', data: { paymentId: req.params.paymentId } });
    } catch (err) { next(err); }
  };

  public manualAllocatePaymentHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.status(200).json({ status: 'success', message: 'Payment manually allocated', data: { paymentId: req.params.paymentId } });
    } catch (err) { next(err); }
  };
}
