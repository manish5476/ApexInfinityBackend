import { Product } from '../../../../src/modules/inventory/domain/entities/Product';
import { ProductStatus } from '../../../../src/modules/inventory/domain/value-objects/InventoryEnums';
import { ProductCreatedEvent } from '../../../../src/modules/inventory/domain/events/ProductCreatedEvent';

describe('Product Entity', () => {
  const baseParams = {
    id: 'prod-uuid-1',
    organizationId: 'org-1',
    name: 'Industrial Widget',
    sku: 'WIDGET-001',
    sellingPrice: 150,
    purchasePrice: 100,
    mrp: 200,
  };

  it('should create a product with ACTIVE status and uppercase SKU', () => {
    const product = Product.create(baseParams);

    expect(product.id).toBe(baseParams.id);
    expect(product.name).toBe('Industrial Widget');
    expect(product.sku).toBe('WIDGET-001');
    expect(product.sellingPrice).toBe(150);
    expect(product.status).toBe(ProductStatus.ACTIVE);
    expect(product.organizationId).toBe('org-1');
  });

  it('should emit a ProductCreatedEvent upon creation', () => {
    const product = Product.create(baseParams);
    expect(product.domainEvents).toHaveLength(1);
    expect(product.domainEvents[0]).toBeInstanceOf(ProductCreatedEvent);
    expect((product.domainEvents[0] as ProductCreatedEvent).payload.productId).toBe(baseParams.id);
  });

  it('should throw error if selling price is negative', () => {
    expect(() => Product.create({ ...baseParams, sellingPrice: -10 })).toThrow('Selling price cannot be negative');
  });

  it('should throw error if MRP is less than selling price', () => {
    expect(() => Product.create({ ...baseParams, sellingPrice: 150, mrp: 120 })).toThrow('MRP cannot be less than selling price');
  });

  it('should correctly update branch stock', () => {
    const product = Product.create(baseParams);
    expect(product.totalStock).toBe(0);

    product.updateStock('branch-1', 50);
    expect(product.totalStock).toBe(50);
    expect(product.availableStock).toBe(50);

    product.updateStock('branch-1', 20);
    expect(product.totalStock).toBe(70);

    product.updateStock('branch-2', 30);
    expect(product.totalStock).toBe(100);
  });

  it('should deactivate product', () => {
    const product = Product.create(baseParams);
    product.deactivate();
    expect(product.status).toBe(ProductStatus.INACTIVE);
  });

  it('should adjust stock correctly with positive and negative delta', () => {
    const product = Product.create(baseParams);
    product.adjustStock('branch-1', 25, 'Physical audit count');
    expect(product.totalStock).toBe(25);

    product.adjustStock('branch-1', -10, 'Damaged items removal');
    expect(product.totalStock).toBe(15);
  });

  it('should transfer stock between branches and reject invalid transfers', () => {
    const product = Product.create(baseParams);
    product.updateStock('branch-1', 50);

    product.transferStock('branch-1', 'branch-2', 20);
    expect(product.inventory.find(i => i.branchId === 'branch-1')?.quantity).toBe(30);
    expect(product.inventory.find(i => i.branchId === 'branch-2')?.quantity).toBe(20);

    // Negative / zero quantity transfer
    expect(() => product.transferStock('branch-1', 'branch-2', 0)).toThrow('Transfer quantity must be greater than zero');

    // Same branch transfer
    expect(() => product.transferStock('branch-1', 'branch-1', 10)).toThrow('Source and destination branches cannot be the same');

    // Insufficient stock transfer
    expect(() => product.transferStock('branch-1', 'branch-2', 100)).toThrow('Insufficient stock in source branch');
  });

  it('should accurately detect low stock', () => {
    const product = Product.create(baseParams);
    product.updateStock('branch-1', 5); // Default reorder level is 10
    expect(product.isLowStock('branch-1')).toBe(true);

    product.updateStock('branch-1', 15); // Total 20 > 10
    expect(product.isLowStock('branch-1')).toBe(false);
  });

  it('should handle soft delete and restore', () => {
    const product = Product.create(baseParams);
    expect(product.isDeleted).toBe(false);
    expect(product.status).toBe(ProductStatus.ACTIVE);

    product.softDelete();
    expect(product.isDeleted).toBe(true);
    expect(product.status).toBe(ProductStatus.INACTIVE);

    product.restore();
    expect(product.isDeleted).toBe(false);
    expect(product.status).toBe(ProductStatus.ACTIVE);
  });

  it('should update product details and validate constraints', () => {
    const product = Product.create(baseParams);
    product.updateDetails({
      name: 'Advanced Industrial Widget',
      sellingPrice: 180,
      mrp: 220,
      tags: ['industrial', 'heavy-duty'],
    });

    expect(product.name).toBe('Advanced Industrial Widget');
    expect(product.sellingPrice).toBe(180);
    expect(product.mrp).toBe(220);
    expect(product.tags).toEqual(['industrial', 'heavy-duty']);

    expect(() => product.updateDetails({ name: '   ' })).toThrow('Product name cannot be empty');
    expect(() => product.updateDetails({ sellingPrice: -5 })).toThrow('Selling price cannot be negative');
    expect(() => product.updateDetails({ mrp: 100 })).toThrow('MRP cannot be less than selling price');
  });
});
