import { InMemorySalesOrderRepository } from '../../../../src/modules/inventory/infrastructure/repositories/InMemorySalesOrderRepository';
import { InMemoryPurchaseOrderRepository } from '../../../../src/modules/inventory/infrastructure/repositories/InMemoryPurchaseOrderRepository';
import { InMemoryProductRepository } from '../../../../src/modules/inventory/infrastructure/repositories/InMemoryProductRepository';
import { Product } from '../../../../src/modules/inventory/domain/entities/Product';
import { SalesOrder } from '../../../../src/modules/inventory/domain/entities/SalesOrder';
import { PurchaseOrder } from '../../../../src/modules/inventory/domain/entities/PurchaseOrder';
import { DispatchSalesOrderUseCase } from '../../../../src/modules/inventory/application/use-cases/DispatchSalesOrderUseCase';
import { CancelSalesOrderUseCase } from '../../../../src/modules/inventory/application/use-cases/CancelSalesOrderUseCase';
import { ListSalesOrdersUseCase } from '../../../../src/modules/inventory/application/use-cases/ListSalesOrdersUseCase';
import { GetSalesOrderByIdUseCase } from '../../../../src/modules/inventory/application/use-cases/GetSalesOrderByIdUseCase';
import { CancelPurchaseOrderUseCase } from '../../../../src/modules/inventory/application/use-cases/CancelPurchaseOrderUseCase';
import { ListPurchaseOrdersUseCase } from '../../../../src/modules/inventory/application/use-cases/ListPurchaseOrdersUseCase';
import { GetPurchaseOrderByIdUseCase } from '../../../../src/modules/inventory/application/use-cases/GetPurchaseOrderByIdUseCase';
import { IEventBus } from '../../../../src/infrastructure/messaging/IEventBus';
import { IUnitOfWork } from '../../../../src/core/application/IUnitOfWork';

describe('Sales & Purchase Order Application Use Cases', () => {
  let soRepo: InMemorySalesOrderRepository;
  let poRepo: InMemoryPurchaseOrderRepository;
  let productRepo: InMemoryProductRepository;
  let fakeEventBus: IEventBus;
  let fakeUow: IUnitOfWork;
  const context = { organizationId: 'org-test-orders' };

  beforeEach(async () => {
    soRepo = new InMemorySalesOrderRepository();
    poRepo = new InMemoryPurchaseOrderRepository();
    productRepo = new InMemoryProductRepository();
    fakeEventBus = {
      publish: jest.fn().mockResolvedValue(undefined),
      publishDomainEvent: jest.fn().mockResolvedValue(undefined),
      subscribe: jest.fn(),
    };
    fakeUow = {
      runInTransaction: jest.fn().mockImplementation(async fn => fn()),
    };

    const product = Product.create({
      id: 'prod-item-1',
      organizationId: context.organizationId,
      name: 'Item 1',
      sellingPrice: 100,
    });
    product.updateStock('branch-1', 50);
    await productRepo.save(product);

    const so = SalesOrder.create({
      id: 'so-1',
      organizationId: context.organizationId,
      branchId: 'branch-1',
      items: [{ productId: 'prod-item-1', name: 'Item 1', quantity: 5, price: 100, taxRate: 0, discount: 0 }],
    });
    await soRepo.save(so);

    const po = PurchaseOrder.create({
      id: 'po-1',
      organizationId: context.organizationId,
      branchId: 'branch-1',
      supplierId: 'supp-1',
      items: [{ productId: 'prod-item-1', name: 'Item 1', quantity: 10, purchasePrice: 70, taxRate: 0, discount: 0 }],
    });
    await poRepo.save(po);
  });

  it('GetSalesOrderByIdUseCase and ListSalesOrdersUseCase work correctly', async () => {
    const getUc = new GetSalesOrderByIdUseCase(soRepo);
    const listUc = new ListSalesOrdersUseCase(soRepo);

    const so = await getUc.execute({ id: 'so-1' }, context);
    expect(so.id).toBe('so-1');
    expect(so.grandTotal).toBe(500);

    const list = await listUc.execute({}, context);
    expect(list.total).toBe(1);
    expect(list.data[0]!.id).toBe('so-1');
  });

  it('DispatchSalesOrderUseCase reduces stock, sets status to fulfilled, and publishes event', async () => {
    const dispatchUc = new DispatchSalesOrderUseCase(soRepo, productRepo, fakeEventBus, fakeUow);
    const res = await dispatchUc.execute({ salesOrderId: 'so-1' }, context);

    expect(res.status).toBe('fulfilled');
    expect(fakeEventBus.publishDomainEvent).toHaveBeenCalled();

    const updatedProduct = await productRepo.findById({ id: 'prod-item-1', organizationId: context.organizationId });
    expect(updatedProduct?.totalStock).toBe(45); // 50 - 5
  });

  it('CancelSalesOrderUseCase marks order as cancelled', async () => {
    const cancelUc = new CancelSalesOrderUseCase(soRepo);
    const res = await cancelUc.execute({ salesOrderId: 'so-1' }, context);

    expect(res.status).toBe('cancelled');
    const updated = await soRepo.findById({ id: 'so-1', organizationId: context.organizationId });
    expect(updated?.status).toBe('cancelled');
  });

  it('GetPurchaseOrderByIdUseCase and ListPurchaseOrdersUseCase work correctly', async () => {
    const getUc = new GetPurchaseOrderByIdUseCase(poRepo);
    const listUc = new ListPurchaseOrdersUseCase(poRepo);

    const po = await getUc.execute({ id: 'po-1' }, context);
    expect(po.id).toBe('po-1');
    expect(po.supplierId).toBe('supp-1');

    const list = await listUc.execute({}, context);
    expect(list.total).toBe(1);
    expect(list.data[0]!.id).toBe('po-1');
  });

  it('CancelPurchaseOrderUseCase marks PO as cancelled', async () => {
    const cancelUc = new CancelPurchaseOrderUseCase(poRepo);
    const res = await cancelUc.execute({ purchaseOrderId: 'po-1' }, context);

    expect(res.status).toBe('cancelled');
    const updated = await poRepo.findById({ id: 'po-1', organizationId: context.organizationId });
    expect(updated?.status).toBe('cancelled');
  });
});
