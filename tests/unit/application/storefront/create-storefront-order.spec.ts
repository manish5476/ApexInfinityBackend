import { CreateStorefrontOrderUseCase } from '../../../../src/modules/storefront/application/use-cases/CreateStorefrontOrderUseCase';
import { InMemoryStorefrontOrderRepository } from '../../../../src/modules/storefront/infrastructure/repositories/InMemoryStorefrontOrderRepository';
import { InMemoryProductRepository } from '../../../../src/modules/inventory/infrastructure/repositories/InMemoryProductRepository';
import { Product } from '../../../../src/modules/inventory/domain/entities/Product';
import { IEventBus } from '../../../../src/infrastructure/messaging/IEventBus';
import { IUnitOfWork } from '../../../../src/core/application/IUnitOfWork';

describe('CreateStorefrontOrderUseCase', () => {
  let orderRepo: InMemoryStorefrontOrderRepository;
  let productRepo: InMemoryProductRepository;
  let eventBus: jest.Mocked<IEventBus>;
  let uow: jest.Mocked<IUnitOfWork>;
  let useCase: CreateStorefrontOrderUseCase;

  beforeEach(() => {
    orderRepo = new InMemoryStorefrontOrderRepository();
    productRepo = new InMemoryProductRepository();
    eventBus = {
      publish: jest.fn().mockResolvedValue(undefined),
      publishDomainEvent: jest.fn().mockResolvedValue(undefined),
      subscribe: jest.fn(),
    };
    uow = {
      runInTransaction: jest.fn().mockImplementation(async (work) => work()),
    };
    useCase = new CreateStorefrontOrderUseCase(orderRepo, eventBus, uow, productRepo);
  });

  it('should validate stock, reprice items from DB, and create order', async () => {
    const product = Product.create({
      id: 'prod-100',
      organizationId: 'org-test',
      name: 'Sneakers',
      sellingPrice: 120,
      taxRate: 10,
    });
    product.updateStock('default', 10);
    await productRepo.save(product);

    const result = await useCase.execute(
      {
        customerEmail: 'buyer@test.com',
        items: [
          { productId: 'prod-100', quantity: 2, unitPrice: 1 }, // Client sends fake unitPrice=1
        ],
        shippingAddress: {
          fullName: 'John Buyer',
          phone: '+919876543210',
          street: '456 High Street',
          city: 'Bangalore',
          state: 'Karnataka',
          postalCode: '560001',
        },
        shippingFee: 15,
      },
      { organizationId: 'org-test' }
    );

    expect(result.orderId).toBeDefined();
    expect(result.orderNumber).toMatch(/^ORD-/);
    // Subtotal: 120 * 2 = 240. Tax (10%): 24. Shipping: 15. Grand total = 279
    expect(result.grandTotal).toBe(279);

    // Verify stock was deducted
    const updatedProd = await productRepo.findById({ id: 'prod-100', organizationId: 'org-test' });
    expect(updatedProd?.availableStock).toBe(8);

    // Verify event was emitted
    expect(eventBus.publishDomainEvent).toHaveBeenCalledTimes(1);
  });

  it('should reject checkout when stock is insufficient', async () => {
    const product = Product.create({
      id: 'prod-low',
      organizationId: 'org-test',
      name: 'Rare Item',
      sellingPrice: 50,
    });
    product.updateStock('default', 1);
    await productRepo.save(product);

    await expect(
      useCase.execute(
        {
          customerEmail: 'buyer@test.com',
          items: [{ productId: 'prod-low', quantity: 5 }],
          shippingAddress: {
            fullName: 'John Buyer',
            phone: '+919876543210',
            street: '456 High Street',
            city: 'Bangalore',
            state: 'Karnataka',
            postalCode: '560001',
          },
        },
        { organizationId: 'org-test' }
      )
    ).rejects.toThrow('Insufficient stock for Rare Item');
  });

  it('should reject checkout when product does not exist', async () => {
    await expect(
      useCase.execute(
        {
          customerEmail: 'buyer@test.com',
          items: [{ productId: 'non-existent', quantity: 1 }],
          shippingAddress: {
            fullName: 'John Buyer',
            phone: '+919876543210',
            street: '456 High Street',
            city: 'Bangalore',
            state: 'Karnataka',
            postalCode: '560001',
          },
        },
        { organizationId: 'org-test' }
      )
    ).rejects.toThrow('Product non-existent is not available');
  });
});
