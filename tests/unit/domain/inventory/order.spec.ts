import { PurchaseOrder } from '../../../../src/modules/inventory/domain/entities/PurchaseOrder';
import { SalesOrder } from '../../../../src/modules/inventory/domain/entities/SalesOrder';
import { OrderStatus } from '../../../../src/modules/inventory/domain/value-objects/InventoryEnums';
import { StockReceivedEvent } from '../../../../src/modules/inventory/domain/events/StockReceivedEvent';
import { StockDispatchedEvent } from '../../../../src/modules/inventory/domain/events/StockDispatchedEvent';

describe('Inventory Order Entities', () => {
  describe('PurchaseOrder', () => {
    it('should create a PurchaseOrder with calculated grand total', () => {
      const po = PurchaseOrder.create({
        id: 'po-1',
        organizationId: 'org-1',
        branchId: 'branch-1',
        supplierId: 'supplier-1',
        items: [
          { productId: 'prod-1', name: 'Widget A', quantity: 10, purchasePrice: 50, taxRate: 10, discount: 0 },
          { productId: 'prod-2', name: 'Widget B', quantity: 5, purchasePrice: 100, taxRate: 0, discount: 50 },
        ],
      });

      // Item 1: 500 + 10% tax = 550
      // Item 2: 500 - 50 discount = 450
      // Grand total = 1000
      expect(po.grandTotal).toBe(1000);
      expect(po.status).toBe(OrderStatus.DRAFT);
    });

    it('should transition to RECEIVED and emit StockReceivedEvent', () => {
      const po = PurchaseOrder.create({
        id: 'po-1',
        organizationId: 'org-1',
        branchId: 'branch-1',
        supplierId: 'supplier-1',
        items: [{ productId: 'prod-1', name: 'Widget A', quantity: 10, purchasePrice: 50, taxRate: 0, discount: 0 }],
      });

      po.receive();
      expect(po.status).toBe(OrderStatus.RECEIVED);
      expect(po.domainEvents).toHaveLength(1);
      expect(po.domainEvents[0]).toBeInstanceOf(StockReceivedEvent);
    });

    it('should throw error when receiving an already received order', () => {
      const po = PurchaseOrder.create({
        id: 'po-1',
        organizationId: 'org-1',
        branchId: 'branch-1',
        supplierId: 'supplier-1',
        items: [{ productId: 'prod-1', name: 'Widget A', quantity: 10, purchasePrice: 50, taxRate: 0, discount: 0 }],
      });
      po.receive();
      expect(() => po.receive()).toThrow('Purchase order already received');
    });
  });

  describe('SalesOrder', () => {
    it('should create a SalesOrder with calculated totals and dispatch', () => {
      const so = SalesOrder.create({
        id: 'so-1',
        organizationId: 'org-1',
        branchId: 'branch-1',
        items: [{ productId: 'prod-1', name: 'Widget A', quantity: 2, price: 100, taxRate: 18, discount: 10 }],
      });

      // 2 * 100 = 200. Discount = 10. Base = 190. Tax 18% of 190 = 34.20. Total = 224.20
      expect(so.grandTotal).toBe(224.2);
      expect(so.status).toBe(OrderStatus.DRAFT);

      so.dispatch();
      expect(so.status).toBe(OrderStatus.FULFILLED);
      expect(so.domainEvents).toHaveLength(1);
      expect(so.domainEvents[0]).toBeInstanceOf(StockDispatchedEvent);
    });
  });
});
