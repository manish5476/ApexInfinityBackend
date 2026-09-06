import { RecordPaymentUseCase } from '../../../../src/modules/accounting/application/use-cases/RecordPaymentUseCase';
import { InMemoryInvoiceRepository } from '../../../../src/modules/accounting/infrastructure/repositories/InMemoryInvoiceRepository';
import { InMemoryPaymentRepository } from '../../../../src/modules/accounting/infrastructure/repositories/InMemoryPaymentRepository';
import { Invoice } from '../../../../src/modules/accounting/domain/entities/Invoice';
import { IEventBus } from '../../../../src/infrastructure/messaging/IEventBus';
import { IUnitOfWork } from '../../../../src/core/application/IUnitOfWork';

describe('RecordPaymentUseCase', () => {
  let invoiceRepo: InMemoryInvoiceRepository;
  let paymentRepo: InMemoryPaymentRepository;
  let eventBus: jest.Mocked<IEventBus>;
  let uow: IUnitOfWork;
  let useCase: RecordPaymentUseCase;

  beforeEach(() => {
    invoiceRepo = new InMemoryInvoiceRepository();
    paymentRepo = new InMemoryPaymentRepository();
    eventBus = {
      publish: jest.fn().mockResolvedValue(undefined),
      publishDomainEvent: jest.fn().mockResolvedValue(undefined),
      subscribe: jest.fn(),
    };
    uow = {
      runInTransaction: jest.fn().mockImplementation(async (work) => work()),
    };
    useCase = new RecordPaymentUseCase(invoiceRepo, paymentRepo, eventBus, uow);
  });

  it('should record payment, update invoice status, and publish PaymentRecordedEvent', async () => {
    const invoice = Invoice.create({
      id: 'inv-100',
      organizationId: 'org-test',
      invoiceNumber: 'INV-100',
      items: [{ productId: 'p1', name: 'Item 1', quantity: 1, price: 500, discount: 0, taxRate: 0 }],
    });
    await invoiceRepo.save(invoice);

    const result = await useCase.execute(
      {
        invoiceId: 'inv-100',
        amount: 500,
      },
      { organizationId: 'org-test' }
    );

    expect(result.invoiceStatus).toBe('paid');
    expect(result.balanceAmount).toBe(0);
    expect(result.paymentId).toBeDefined();

    const updatedInvoice = await invoiceRepo.findById({ id: 'inv-100', organizationId: 'org-test' });
    expect(updatedInvoice?.paidAmount).toBe(500);
    expect(updatedInvoice?.paymentStatus).toBe('paid');

    const payment = await paymentRepo.findById({ id: result.paymentId, organizationId: 'org-test' });
    expect(payment).toBeDefined();
    expect(payment?.amount).toBe(500);

    expect(eventBus.publishDomainEvent).toHaveBeenCalledTimes(1);
  });
});
