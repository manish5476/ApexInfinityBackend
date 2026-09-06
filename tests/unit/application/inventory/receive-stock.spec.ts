import { ReceiveStockUseCase } from '../../../../src/modules/inventory/application/use-cases/ReceiveStockUseCase';
import { InMemoryPurchaseOrderRepository } from '../../../../src/modules/inventory/infrastructure/repositories/InMemoryPurchaseOrderRepository';
import { InMemoryProductRepository } from '../../../../src/modules/inventory/infrastructure/repositories/InMemoryProductRepository';
import { PurchaseOrder } from '../../../../src/modules/inventory/domain/entities/PurchaseOrder';
import { Product } from '../../../../src/modules/inventory/domain/entities/Product';
import { IEventBus } from '../../../../src/infrastructure/messaging/IEventBus';
import { IUnitOfWork } from '../../../../src/core/application/IUnitOfWork';

describe('ReceiveStockUseCase', () => {
  let poRepo: InMemoryPurchaseOrderRepository;
  let productRepo: InMemoryProductRepository;
  let eventBus: jest.Mocked<IEventBus>;
  let uow: IUnitOfWork;
  let useCase: ReceiveStockUseCase;

  beforeEach(() => {
    poRepo = new InMemoryPurchaseOrderRepository();
    productRepo = new InMemoryProductRepository();
    eventBus = {
      publish: jest.fn().mockResolvedValue(undefined),
      publishDomainEvent: jest.fn().mockResolvedValue(undefined),
      subscribe: jest.fn(),
    };
    uow = {
      runInTransaction: jest.fn().mockImplementation(async (work) => work()),
    };
    useCase = new ReceiveStockUseCase(poRepo, productRepo, eventBus, uow);
  });

  it('should receive purchase order, update product inventory, and publish event', async () => {
    // 1. Seed Product
    const product = Product.create({
      id: 'prod-100',
      organizationId: 'org-test',
      name: 'Steel Rod',
      sellingPrice: 100,
    });
    await productRepo.save(product);

    // 2. Seed Purchase Order
    const po = PurchaseOrder.create({
      id: 'po-100',
      organizationId: 'org-test',
      branchId: 'main-branch',
      supplierId: 'supp-1',
      items: [{ productId: 'prod-100', name: 'Steel Rod', quantity: 25, purchasePrice: 70, taxRate: 0, discount: 0 }],
    });
    await poRepo.save(po);

    // 3. Execute
    const result = await useCase.execute({ purchaseOrderId: 'po-100' }, { organizationId: 'org-test' });

    expect(result.status).toBe('received');

    // 4. Verify Product Stock
    const updatedProd = await productRepo.findById({ id: 'prod-100', organizationId: 'org-test' });
    expect(updatedProd?.totalStock).toBe(25);
    expect(eventBus.publishDomainEvent).toHaveBeenCalledTimes(1);
  });
});
