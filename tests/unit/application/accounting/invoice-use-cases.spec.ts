import { InMemoryInvoiceRepository } from '../../../../src/modules/accounting/infrastructure/repositories/InMemoryInvoiceRepository';
import { Invoice } from '../../../../src/modules/accounting/domain/entities/Invoice';
import { GetInvoiceByIdUseCase } from '../../../../src/modules/accounting/application/use-cases/GetInvoiceByIdUseCase';
import { UpdateInvoiceUseCase } from '../../../../src/modules/accounting/application/use-cases/UpdateInvoiceUseCase';
import { CancelInvoiceUseCase } from '../../../../src/modules/accounting/application/use-cases/CancelInvoiceUseCase';
import { DeleteInvoiceUseCase } from '../../../../src/modules/accounting/application/use-cases/DeleteInvoiceUseCase';
import { RestoreInvoiceUseCase } from '../../../../src/modules/accounting/application/use-cases/RestoreInvoiceUseCase';
import { GetCustomerInvoicesUseCase } from '../../../../src/modules/accounting/application/use-cases/GetCustomerInvoicesUseCase';
import { GetCustomerInvoiceSummaryUseCase } from '../../../../src/modules/accounting/application/use-cases/GetCustomerInvoiceSummaryUseCase';
import { GetOutstandingInvoicesReportUseCase } from '../../../../src/modules/accounting/application/use-cases/GetOutstandingInvoicesReportUseCase';
import { ListInvoicesUseCase } from '../../../../src/modules/accounting/application/use-cases/ListInvoicesUseCase';

describe('Invoice Application Use Cases', () => {
  let invoiceRepo: InMemoryInvoiceRepository;
  const context = { organizationId: 'org-inv-test' };

  beforeEach(async () => {
    invoiceRepo = new InMemoryInvoiceRepository();

    const inv1 = Invoice.create({
      id: 'inv-1',
      organizationId: context.organizationId,
      customerId: 'cust-1',
      invoiceNumber: 'INV-1001',
      items: [{ productId: 'p1', name: 'Product 1', quantity: 2, price: 100, discount: 0, taxRate: 0 }],
    });

    const inv2 = Invoice.create({
      id: 'inv-2',
      organizationId: context.organizationId,
      customerId: 'cust-1',
      invoiceNumber: 'INV-1002',
      items: [{ productId: 'p2', name: 'Product 2', quantity: 1, price: 300, discount: 0, taxRate: 0 }],
    });
    inv2.recordPayment(100); // balance 200

    await invoiceRepo.save(inv1);
    await invoiceRepo.save(inv2);
  });

  it('GetInvoiceByIdUseCase returns invoice', async () => {
    const uc = new GetInvoiceByIdUseCase(invoiceRepo);
    const invoice = await uc.execute({ id: 'inv-1' }, context);
    expect(invoice.id).toBe('inv-1');
    expect(invoice.invoiceNumber).toBe('INV-1001');

    await expect(uc.execute({ id: 'invalid' }, context)).rejects.toThrow('Invoice not found');
  });

  it('UpdateInvoiceUseCase modifies invoice fields', async () => {
    const uc = new UpdateInvoiceUseCase(invoiceRepo);
    const updated = await uc.execute(
      {
        id: 'inv-1',
        data: { notes: 'Urgent delivery requested', billingAddress: '123 Main St' },
      },
      context
    );
    expect(updated.notes).toBe('Urgent delivery requested');
    expect(updated.billingAddress).toBe('123 Main St');
  });

  it('CancelInvoiceUseCase marks invoice as cancelled', async () => {
    const uc = new CancelInvoiceUseCase(invoiceRepo);
    const res = await uc.execute({ id: 'inv-1' }, context);
    expect(res.status).toBe('cancelled');

    const inv = await invoiceRepo.findById({ id: 'inv-1', organizationId: context.organizationId });
    expect(inv?.status).toBe('cancelled');
  });

  it('DeleteInvoiceUseCase soft-deletes and RestoreInvoiceUseCase restores invoice', async () => {
    const deleteUc = new DeleteInvoiceUseCase(invoiceRepo);
    const restoreUc = new RestoreInvoiceUseCase(invoiceRepo);

    await deleteUc.execute({ id: 'inv-1' }, context);
    const afterDelete = await invoiceRepo.findById({ id: 'inv-1', organizationId: context.organizationId });
    expect(afterDelete?.isDeleted).toBe(true);

    const restored = await restoreUc.execute({ id: 'inv-1' }, context);
    expect(restored.isDeleted).toBe(false);
  });

  it('GetCustomerInvoicesUseCase and GetCustomerInvoiceSummaryUseCase calculate balances', async () => {
    const getCustInvoicesUc = new GetCustomerInvoicesUseCase(invoiceRepo);
    const summaryUc = new GetCustomerInvoiceSummaryUseCase(invoiceRepo);

    const list = await getCustInvoicesUc.execute({ customerId: 'cust-1' }, context);
    expect(list).toHaveLength(2);

    const summary = await summaryUc.execute({ customerId: 'cust-1' }, context);
    expect(summary.totalInvoices).toBe(2);
    expect(summary.totalBilled).toBe(500); // 200 + 300
    expect(summary.totalPaid).toBe(100);
    expect(summary.totalOutstanding).toBe(400);
  });

  it('GetOutstandingInvoicesReportUseCase returns all unpaid invoices', async () => {
    const uc = new GetOutstandingInvoicesReportUseCase(invoiceRepo);
    const report = await uc.execute({}, context);
    expect(report.totalOutstanding).toBe(400);
    expect(report.invoices).toHaveLength(2);
  });

  it('ListInvoicesUseCase filters by status and paymentStatus', async () => {
    const uc = new ListInvoicesUseCase(invoiceRepo);
    const res = await uc.execute({ paymentStatus: 'partial' }, context);
    expect(res.total).toBe(1);
    expect(res.data[0]!.id).toBe('inv-2');
  });
});
