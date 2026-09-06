import { CreateInvoiceUseCase } from '../../../../src/modules/accounting/application/use-cases/CreateInvoiceUseCase';
import { InMemoryInvoiceRepository } from '../../../../src/modules/accounting/infrastructure/repositories/InMemoryInvoiceRepository';
import { IEventBus } from '../../../../src/infrastructure/messaging/IEventBus';
import { IUnitOfWork } from '../../../../src/core/application/IUnitOfWork';

describe('CreateInvoiceUseCase', () => {
  let invoiceRepo: InMemoryInvoiceRepository;
  let eventBus: jest.Mocked<IEventBus>;
  let uow: IUnitOfWork;
  let useCase: CreateInvoiceUseCase;

  beforeEach(() => {
    invoiceRepo = new InMemoryInvoiceRepository();
    eventBus = {
      publish: jest.fn().mockResolvedValue(undefined),
      publishDomainEvent: jest.fn().mockResolvedValue(undefined),
      subscribe: jest.fn(),
    };
    uow = {
      runInTransaction: jest.fn().mockImplementation(async (work) => work()),
    };
    useCase = new CreateInvoiceUseCase(invoiceRepo, eventBus, uow);
  });

  it('should create an invoice and publish domain event', async () => {
    const result = await useCase.execute(
      {
        invoiceNumber: 'INV-100',
        items: [{ productId: 'p1', name: 'Item 1', quantity: 2, price: 50, discount: 0, taxRate: 0 }],
      },
      { organizationId: 'org-test' }
    );

    expect(result.id).toBeDefined();
    expect(result.invoiceNumber).toBe('INV-100');
    expect(result.grandTotal).toBe(100);
    expect(result.status).toBe('issued');
    expect(eventBus.publishDomainEvent).toHaveBeenCalledTimes(1);
  });

  it('should reject duplicate invoice number in the same organization', async () => {
    await useCase.execute(
      {
        invoiceNumber: 'INV-100',
        items: [{ productId: 'p1', name: 'Item 1', quantity: 1, price: 10, discount: 0, taxRate: 0 }],
      },
      { organizationId: 'org-test' }
    );

    await expect(
      useCase.execute(
        {
          invoiceNumber: 'INV-100',
          items: [{ productId: 'p2', name: 'Item 2', quantity: 1, price: 20, discount: 0, taxRate: 0 }],
        },
        { organizationId: 'org-test' }
      )
    ).rejects.toThrow("Invoice number 'INV-100' already exists");
  });
});
