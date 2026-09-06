import { InMemoryPaymentRepository } from '../../../../src/modules/accounting/infrastructure/repositories/InMemoryPaymentRepository';
import { InMemoryInvoiceRepository } from '../../../../src/modules/accounting/infrastructure/repositories/InMemoryInvoiceRepository';
import { InMemoryAccountRepository } from '../../../../src/modules/accounting/infrastructure/repositories/InMemoryAccountRepository';
import { InMemoryAccountEntryRepository } from '../../../../src/modules/accounting/infrastructure/repositories/InMemoryAccountEntryRepository';
import { Invoice } from '../../../../src/modules/accounting/domain/entities/Invoice';
import { Account } from '../../../../src/modules/accounting/domain/entities/Account';
import { AccountEntry } from '../../../../src/modules/accounting/domain/entities/AccountEntry';
import { CreatePaymentUseCase } from '../../../../src/modules/accounting/application/use-cases/CreatePaymentUseCase';
import { ListPaymentsUseCase } from '../../../../src/modules/accounting/application/use-cases/ListPaymentsUseCase';
import { GetPaymentByIdUseCase } from '../../../../src/modules/accounting/application/use-cases/GetPaymentByIdUseCase';
import { CancelPaymentUseCase } from '../../../../src/modules/accounting/application/use-cases/CancelPaymentUseCase';
import { GetCustomerPaymentsUseCase } from '../../../../src/modules/accounting/application/use-cases/GetCustomerPaymentsUseCase';
import { ListLedgerEntriesUseCase } from '../../../../src/modules/accounting/application/use-cases/ListLedgerEntriesUseCase';
import { GetTrialBalanceUseCase } from '../../../../src/modules/accounting/application/use-cases/GetTrialBalanceUseCase';
import { GetProfitLossUseCase } from '../../../../src/modules/accounting/application/use-cases/GetProfitLossUseCase';
import { GetBalanceSheetUseCase } from '../../../../src/modules/accounting/application/use-cases/GetBalanceSheetUseCase';
import { PaymentType, AccountType } from '../../../../src/modules/accounting/domain/value-objects/AccountingEnums';
import { IEventBus } from '../../../../src/infrastructure/messaging/IEventBus';
import { IUnitOfWork } from '../../../../src/core/application/IUnitOfWork';

describe('Payment & Ledger Application Use Cases', () => {
  let paymentRepo: InMemoryPaymentRepository;
  let invoiceRepo: InMemoryInvoiceRepository;
  let accountRepo: InMemoryAccountRepository;
  let entryRepo: InMemoryAccountEntryRepository;
  let fakeEventBus: IEventBus;
  let fakeUow: IUnitOfWork;
  const context = { organizationId: 'org-pay-ledger-test' };

  beforeEach(async () => {
    paymentRepo = new InMemoryPaymentRepository();
    invoiceRepo = new InMemoryInvoiceRepository();
    accountRepo = new InMemoryAccountRepository();
    entryRepo = new InMemoryAccountEntryRepository();
    fakeEventBus = {
      publish: jest.fn().mockResolvedValue(undefined),
      publishDomainEvent: jest.fn().mockResolvedValue(undefined),
      subscribe: jest.fn(),
    };
    fakeUow = {
      runInTransaction: jest.fn().mockImplementation(async fn => fn()),
    };

    const inv = Invoice.create({
      id: 'inv-10',
      organizationId: context.organizationId,
      customerId: 'cust-10',
      invoiceNumber: 'INV-10',
      items: [{ productId: 'p1', name: 'Service', quantity: 1, price: 500, discount: 0, taxRate: 0 }],
    });
    await invoiceRepo.save(inv);

    const assetAcc = Account.create({
      id: 'acc-cash',
      organizationId: context.organizationId,
      code: '1000',
      name: 'Cash',
      type: AccountType.ASSET,
    });
    const revAcc = Account.create({
      id: 'acc-sales',
      organizationId: context.organizationId,
      code: '4000',
      name: 'Sales Revenue',
      type: AccountType.REVENUE,
    });
    await accountRepo.save(assetAcc);
    await accountRepo.save(revAcc);
  });

  it('CreatePaymentUseCase creates payment and allocates to invoice', async () => {
    const uc = new CreatePaymentUseCase(paymentRepo, invoiceRepo, fakeEventBus, fakeUow);
    const payment = await uc.execute(
      {
        type: PaymentType.INFLOW,
        customerId: 'cust-10',
        invoiceId: 'inv-10',
        amount: 200,
        remarks: 'Advance partial payment',
      },
      context
    );

    expect(payment.amount).toBe(200);
    expect(payment.remainingAmount).toBe(0);
    expect(payment.allocationStatus).toBe('fully_allocated');
    expect(payment.allocatedTo).toHaveLength(1);

    const inv = await invoiceRepo.findById({ id: 'inv-10', organizationId: context.organizationId });
    expect(inv?.paidAmount).toBe(200);
    expect(inv?.balanceAmount).toBe(300);
  });

  it('ListPaymentsUseCase, GetPaymentByIdUseCase, and CancelPaymentUseCase manage payments', async () => {
    const createUc = new CreatePaymentUseCase(paymentRepo, invoiceRepo, fakeEventBus, fakeUow);
    const listUc = new ListPaymentsUseCase(paymentRepo);
    const getUc = new GetPaymentByIdUseCase(paymentRepo);
    const cancelUc = new CancelPaymentUseCase(paymentRepo);
    const custPaymentsUc = new GetCustomerPaymentsUseCase(paymentRepo);

    const created = await createUc.execute(
      { type: PaymentType.INFLOW, customerId: 'cust-10', amount: 150 },
      context
    );

    const retrieved = await getUc.execute({ id: created.id }, context);
    expect(retrieved.amount).toBe(150);

    const custPayments = await custPaymentsUc.execute({ customerId: 'cust-10' }, context);
    expect(custPayments).toHaveLength(1);

    const cancelRes = await cancelUc.execute({ id: created.id }, context);
    expect(cancelRes.status).toBe('cancelled');

    const list = await listUc.execute({}, context);
    expect(list.total).toBe(1);
  });

  it('General Ledger and Financial Statements (Trial Balance, P&L, Balance Sheet)', async () => {
    // Debit cash 500, Credit sales revenue 500
    const entry1 = AccountEntry.create({
      id: 'e-1',
      organizationId: context.organizationId,
      accountId: 'acc-cash',
      debit: 500,
      description: 'Sale cash receipt',
    });
    const entry2 = AccountEntry.create({
      id: 'e-2',
      organizationId: context.organizationId,
      accountId: 'acc-sales',
      credit: 500,
      description: 'Revenue recognition',
    });
    await entryRepo.saveMany([entry1, entry2]);

    const listUc = new ListLedgerEntriesUseCase(entryRepo);
    const tbUc = new GetTrialBalanceUseCase(entryRepo, accountRepo);
    const plUc = new GetProfitLossUseCase(entryRepo, accountRepo);
    const bsUc = new GetBalanceSheetUseCase(entryRepo, accountRepo);

    const entries = await listUc.execute({}, context);
    expect(entries.total).toBe(2);

    const tb = await tbUc.execute({}, context);
    expect(tb).toHaveLength(2);
    const cashTb = tb.find(t => t.accountId === 'acc-cash');
    expect(cashTb?.totalDebit).toBe(500);
    expect(cashTb?.accountName).toBe('Cash');

    const pl = await plUc.execute({}, context);
    expect(pl.revenue).toBe(500);
    expect(pl.expense).toBe(0);
    expect(pl.netProfit).toBe(500);

    const bs = await bsUc.execute({}, context);
    expect(bs.assets).toBe(500);
    expect(bs.liabilities).toBe(0);
  });
});
