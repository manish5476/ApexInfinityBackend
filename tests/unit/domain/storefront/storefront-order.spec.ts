import { StorefrontOrder } from '../../../../src/modules/storefront/domain/entities/StorefrontOrder';
import { StorefrontOrderStatus } from '../../../../src/modules/storefront/domain/value-objects/StorefrontEnums';
import { StorefrontOrderCreatedEvent } from '../../../../src/modules/storefront/domain/events/StorefrontOrderCreatedEvent';

describe('StorefrontOrder Aggregate Root', () => {
  const baseParams = {
    id: 'ord-1',
    organizationId: 'org-1',
    orderNumber: 'ORD-1001',
    customerEmail: 'shopper@example.com',
    items: [
      { productId: 'p1', name: 'T-Shirt', quantity: 2, unitPrice: 25, lineTotal: 50 },
      { productId: 'p2', name: 'Cap', quantity: 1, unitPrice: 20, lineTotal: 20 },
    ],
    shippingAddress: {
      fullName: 'John Doe',
      phone: '+919876543210',
      street: '123 Market St',
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400001',
    },
    shippingFee: 10,
    discount: 5,
    tax: 5,
  };

  it('should calculate totals and emit StorefrontOrderCreatedEvent', () => {
    // subtotal = 70. discount = 5. shipping = 10. tax = 5. grand total = 80
    const order = StorefrontOrder.create(baseParams);

    expect(order.id).toBe('ord-1');
    expect(order.orderNumber).toBe('ORD-1001');
    expect(order.totals.subtotal).toBe(70);
    expect(order.totals.grandTotal).toBe(80);
    expect(order.status).toBe(StorefrontOrderStatus.PENDING);
    expect(order.paymentStatus).toBe('unpaid');

    expect(order.domainEvents).toHaveLength(1);
    expect(order.domainEvents[0]).toBeInstanceOf(StorefrontOrderCreatedEvent);
  });

  it('should throw error when order has no items', () => {
    expect(() =>
      StorefrontOrder.create({
        ...baseParams,
        items: [],
      })
    ).toThrow('Storefront order must contain at least one item');
  });

  it('should confirm and mark paid', () => {
    const order = StorefrontOrder.create(baseParams);
    order.confirm();
    expect(order.status).toBe(StorefrontOrderStatus.CONFIRMED);

    order.markPaid();
    expect(order.paymentStatus).toBe('paid');
  });

  it('should cancel an unfulfilled order', () => {
    const order = StorefrontOrder.create(baseParams);
    order.cancel();
    expect(order.status).toBe(StorefrontOrderStatus.CANCELLED);
  });
});
