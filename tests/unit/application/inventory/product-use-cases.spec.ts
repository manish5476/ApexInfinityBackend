import { InMemoryProductRepository } from '../../../../src/modules/inventory/infrastructure/repositories/InMemoryProductRepository';
import { Product } from '../../../../src/modules/inventory/domain/entities/Product';
import { GetProductByIdUseCase } from '../../../../src/modules/inventory/application/use-cases/GetProductByIdUseCase';
import { UpdateProductUseCase } from '../../../../src/modules/inventory/application/use-cases/UpdateProductUseCase';
import { DeleteProductUseCase } from '../../../../src/modules/inventory/application/use-cases/DeleteProductUseCase';
import { RestoreProductUseCase } from '../../../../src/modules/inventory/application/use-cases/RestoreProductUseCase';
import { SearchProductsUseCase } from '../../../../src/modules/inventory/application/use-cases/SearchProductsUseCase';
import { ScanProductUseCase } from '../../../../src/modules/inventory/application/use-cases/ScanProductUseCase';
import { GetLowStockProductsUseCase } from '../../../../src/modules/inventory/application/use-cases/GetLowStockProductsUseCase';
import { AdjustStockUseCase } from '../../../../src/modules/inventory/application/use-cases/AdjustStockUseCase';
import { TransferStockUseCase } from '../../../../src/modules/inventory/application/use-cases/TransferStockUseCase';
import { BulkUpdateProductsUseCase } from '../../../../src/modules/inventory/application/use-cases/BulkUpdateProductsUseCase';
import { ListProductsUseCase } from '../../../../src/modules/inventory/application/use-cases/ListProductsUseCase';

describe('Product Application Use Cases', () => {
  let productRepo: InMemoryProductRepository;
  const context = { organizationId: 'org-test-1' };

  beforeEach(async () => {
    productRepo = new InMemoryProductRepository();
    const product1 = Product.create({
      id: 'prod-1',
      organizationId: context.organizationId,
      name: 'Alpha Drill',
      sku: 'DRILL-001',
      barcode: '8901234567890',
      sellingPrice: 120,
      purchasePrice: 80,
      tags: ['power-tools', 'hardware'],
    });
    product1.updateStock('branch-main', 5); // Low stock (<= 10)

    const product2 = Product.create({
      id: 'prod-2',
      organizationId: context.organizationId,
      name: 'Beta Hammer',
      sku: 'HAMMER-002',
      barcode: '8909876543210',
      sellingPrice: 45,
      purchasePrice: 25,
      tags: ['hand-tools'],
    });
    product2.updateStock('branch-main', 50);

    await productRepo.save(product1);
    await productRepo.save(product2);
  });

  it('GetProductByIdUseCase returns product or throws if not found', async () => {
    const uc = new GetProductByIdUseCase(productRepo);
    const res = await uc.execute({ id: 'prod-1' }, context);
    expect(res.id).toBe('prod-1');
    expect(res.name).toBe('Alpha Drill');

    await expect(uc.execute({ id: 'non-existent' }, context)).rejects.toThrow('Product not found');
  });

  it('UpdateProductUseCase modifies fields and prevents duplicate SKU', async () => {
    const uc = new UpdateProductUseCase(productRepo);
    const updated = await uc.execute(
      {
        id: 'prod-1',
        data: { name: 'Alpha Drill Pro', sellingPrice: 140 },
      },
      context
    );
    expect(updated.name).toBe('Alpha Drill Pro');
    expect(updated.sellingPrice).toBe(140);

    // Conflict with product2's SKU
    await expect(
      uc.execute(
        {
          id: 'prod-1',
          data: { sku: 'HAMMER-002' },
        },
        context
      )
    ).rejects.toThrow("Product with SKU 'HAMMER-002' already exists");
  });

  it('DeleteProductUseCase soft-deletes and RestoreProductUseCase restores', async () => {
    const deleteUc = new DeleteProductUseCase(productRepo);
    const restoreUc = new RestoreProductUseCase(productRepo);

    await deleteUc.execute({ id: 'prod-1' }, context);
    const afterDelete = await productRepo.findById({ id: 'prod-1', organizationId: context.organizationId });
    expect(afterDelete?.isDeleted).toBe(true);

    const restored = await restoreUc.execute({ id: 'prod-1' }, context);
    expect(restored.isDeleted).toBe(false);
  });

  it('SearchProductsUseCase finds matching products', async () => {
    const uc = new SearchProductsUseCase(productRepo);
    const results = await uc.execute({ query: 'Drill' }, context);
    expect(results).toHaveLength(1);
    expect(results[0]!.sku).toBe('DRILL-001');

    const byTag = await uc.execute({ query: 'hand-tools' }, context);
    expect(byTag).toHaveLength(1);
    expect(byTag[0]!.id).toBe('prod-2');
  });

  it('ScanProductUseCase finds product by SKU or barcode', async () => {
    const uc = new ScanProductUseCase(productRepo);
    const byBarcode = await uc.execute({ code: '8901234567890' }, context);
    expect(byBarcode.id).toBe('prod-1');

    const bySku = await uc.execute({ code: 'HAMMER-002' }, context);
    expect(bySku.id).toBe('prod-2');

    await expect(uc.execute({ code: 'UNKNOWN-999' }, context)).rejects.toThrow("Product not found for scan code 'UNKNOWN-999'");
  });

  it('GetLowStockProductsUseCase filters low stock items', async () => {
    const uc = new GetLowStockProductsUseCase(productRepo);
    const lowStock = await uc.execute({ branchId: 'branch-main' }, context);
    expect(lowStock).toHaveLength(1);
    expect(lowStock[0]!.id).toBe('prod-1');
  });

  it('AdjustStockUseCase and TransferStockUseCase modify stock levels', async () => {
    const adjustUc = new AdjustStockUseCase(productRepo);
    const transferUc = new TransferStockUseCase(productRepo);

    const adjusted = await adjustUc.execute(
      { productId: 'prod-2', branchId: 'branch-main', delta: 10, reason: 'Stock intake' },
      context
    );
    expect(adjusted.totalStock).toBe(60);

    const transferred = await transferUc.execute(
      { productId: 'prod-2', fromBranchId: 'branch-main', toBranchId: 'branch-secondary', quantity: 20 },
      context
    );
    expect(transferred.inventory.find(i => i.branchId === 'branch-main')?.quantity).toBe(40);
    expect(transferred.inventory.find(i => i.branchId === 'branch-secondary')?.quantity).toBe(20);
  });

  it('BulkUpdateProductsUseCase updates multiple products', async () => {
    const uc = new BulkUpdateProductsUseCase(productRepo);
    const res = await uc.execute(
      {
        items: [
          { id: 'prod-1', data: { purchasePrice: 85 } },
          { id: 'prod-2', data: { purchasePrice: 30 } },
        ],
      },
      context
    );
    expect(res.updatedCount).toBe(2);
    expect(res.products.find(p => p.id === 'prod-1')?.purchasePrice).toBe(85);
    expect(res.products.find(p => p.id === 'prod-2')?.purchasePrice).toBe(30);
  });

  it('ListProductsUseCase returns paginated list excluding deleted by default', async () => {
    const uc = new ListProductsUseCase(productRepo);
    const res = await uc.execute({ page: 1, limit: 10 }, context);
    expect(res.total).toBe(2);
    expect(res.data).toHaveLength(2);
  });
});
