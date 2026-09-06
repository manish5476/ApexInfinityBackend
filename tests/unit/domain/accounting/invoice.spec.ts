import { Invoice } from '../../../../src/modules/accounting/domain/entities/Invoice';
import { InvoiceStatus, PaymentMethod } from '../../../../src/modules/accounting/domain/value-objects/AccountingEnums';
import { InvoiceCreatedEvent } from '../../../../src/modules/accounting/domain/events/InvoiceCreatedEvent';

describe('Invoice Entity', () => {
  const baseParams = {
    id: 'inv-1',
    organizationId: 'org-1',
    invoiceNumber: 'INV-2026-001',
    items: [
      { productId: 'prod-1', name: 'Widget A', quantity: 2, price: 100, discount: 20, taxRate: 10 },
      // line 1: base = (200 - 20) = 180, tax = 18. line total = 198
    ],
    shippingCharges: 15,
    roundOff: -0.2, // total = 198 + 15 - 0.2 = 212.80
    paymentMethod: PaymentMethod.CASH,
  };

  it('should create invoice with calculated grandTotal and emit InvoiceCreatedEvent', () => {
    const invoice = Invoice.create(baseParams);

    expect(invoice.id).toBe('inv-1');
    expect(invoice.invoiceNumber).toBe('INV-2026-001');
    expect(invoice.grandTotal).toBe(212.8);
    expect(invoice.balanceAmount).toBe(212.8);
    expect(invoice.paidAmount).toBe(0);
    expect(invoice.paymentStatus).toBe('unpaid');
    expect(invoice.status).toBe(InvoiceStatus.ISSUED);

    expect(invoice.domainEvents).toHaveLength(1);
    expect(invoice.domainEvents[0]).toBeInstanceOf(InvoiceCreatedEvent);
    expect((invoice.domainEvents[0] as InvoiceCreatedEvent).payload.grandTotal).toBe(212.8);
  });

  it('should record partial payment correctly', () => {
    const invoice = Invoice.create(baseParams);
    invoice.recordPayment(100);

    expect(invoice.paidAmount).toBe(100);
    expect(invoice.balanceAmount).toBe(112.8);
    expect(invoice.paymentStatus).toBe('partial');
    expect(invoice.status).toBe(InvoiceStatus.ISSUED);
  });

  it('should record full payment and mark PAID', () => {
    const invoice = Invoice.create(baseParams);
    invoice.recordPayment(212.8);

    expect(invoice.paidAmount).toBe(212.8);
    expect(invoice.balanceAmount).toBe(0);
    expect(invoice.paymentStatus).toBe('paid');
    expect(invoice.status).toBe(InvoiceStatus.PAID);
  });

  it('should throw error when recording payment greater than balance', () => {
    const invoice = Invoice.create(baseParams);
    expect(() => invoice.recordPayment(300)).toThrow('Payment exceeds outstanding balance');
  });

  it('should cancel an unpaid invoice', () => {
    const invoice = Invoice.create(baseParams);
    invoice.cancel();
    expect(invoice.status).toBe(InvoiceStatus.CANCELLED);
  });

  it('should prevent cancelling a paid invoice', () => {
    const invoice = Invoice.create(baseParams);
    invoice.recordPayment(212.8);
    expect(() => invoice.cancel()).toThrow('Cannot cancel a fully paid invoice');
  });

  it('should update invoice details', () => {
    const invoice = Invoice.create(baseParams);
    invoice.updateDetails({
      notes: 'Customer requested delayed shipment',
      billingAddress: '42 Wallaby Way, Sydney',
      shippingAddress: '42 Wallaby Way, Sydney',
    });

    expect(invoice.props.notes).toBe('Customer requested delayed shipment');
    expect(invoice.props.billingAddress).toBe('42 Wallaby Way, Sydney');
  });

  it('should soft delete and restore invoice', () => {
    const invoice = Invoice.create(baseParams);
    expect(invoice.isDeleted).toBe(false);

    invoice.softDelete();
    expect(invoice.isDeleted).toBe(true);

    invoice.restore();
    expect(invoice.isDeleted).toBe(false);
  });
});
