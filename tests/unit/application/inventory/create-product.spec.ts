import { CreateProductUseCase } from '../../../../src/modules/inventory/application/use-cases/CreateProductUseCase';
import { InMemoryProductRepository } from '../../../../src/modules/inventory/infrastructure/repositories/InMemoryProductRepository';
import { IEventBus } from '../../../../src/infrastructure/messaging/IEventBus';

describe('CreateProductUseCase', () => {
  let productRepo: InMemoryProductRepository;
  let eventBus: jest.Mocked<IEventBus>;
  let useCase: CreateProductUseCase;

  beforeEach(() => {
    productRepo = new InMemoryProductRepository();
    eventBus = {
      publish: jest.fn().mockResolvedValue(undefined),
      publishDomainEvent: jest.fn().mockResolvedValue(undefined),
      subscribe: jest.fn(),
    };
    useCase = new CreateProductUseCase(productRepo, eventBus);
  });

  it('should successfully create a product and publish event', () => {
    return useCase.execute(
      {
        name: 'Hammer',
        sku: 'HAM-001',
        sellingPrice: 25.5,
        purchasePrice: 15.0,
      },
      { organizationId: 'org-test' }
    ).then((result) => {
      expect(result.id).toBeDefined();
      expect(result.name).toBe('Hammer');
      expect(result.sku).toBe('HAM-001');
      expect(result.sellingPrice).toBe(25.5);
      expect(eventBus.publishDomainEvent).toHaveBeenCalledTimes(1);
    });
  });

  it('should reject duplicate SKU within the same organization', async () => {
    await useCase.execute(
      { name: 'Hammer 1', sku: 'HAM-001', sellingPrice: 25 },
      { organizationId: 'org-test' }
    );

    await expect(
      useCase.execute(
        { name: 'Hammer 2', sku: 'HAM-001', sellingPrice: 30 },
        { organizationId: 'org-test' }
      )
    ).rejects.toThrow("Product with SKU 'HAM-001' already exists");
  });
});
