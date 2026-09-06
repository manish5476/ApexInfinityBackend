import { Payment } from '../../../../src/modules/accounting/domain/entities/Payment';
import { PaymentMethod, PaymentType } from '../../../../src/modules/accounting/domain/value-objects/AccountingEnums';
import { PaymentRecordedEvent } from '../../../../src/modules/accounting/domain/events/PaymentRecordedEvent';

describe('Payment Entity', () => {
  it('should create an inflow payment and emit PaymentRecordedEvent', () => {
    const payment = Payment.create({
      id: 'pay-1',
      organizationId: 'org-1',
      type: PaymentType.INFLOW,
      invoiceId: 'inv-1',
      amount: 500,
      paymentMethod: PaymentMethod.UPI,
      transactionId: 'TXN-999',
    });

    expect(payment.id).toBe('pay-1');
    expect(payment.amount).toBe(500);
    expect(payment.type).toBe(PaymentType.INFLOW);
    expect(payment.invoiceId).toBe('inv-1');
    expect(payment.status).toBe('completed');

    expect(payment.domainEvents).toHaveLength(1);
    expect(payment.domainEvents[0]).toBeInstanceOf(PaymentRecordedEvent);
    expect((payment.domainEvents[0] as PaymentRecordedEvent).payload.amount).toBe(500);
  });

  it('should reject payment with zero or negative amount', () => {
    expect(() =>
      Payment.create({
        id: 'pay-2',
        organizationId: 'org-1',
        type: PaymentType.INFLOW,
        amount: 0,
      })
    ).toThrow('Payment amount must be greater than zero');
  });

  it('should allocate payment to invoice and update remaining amount', () => {
    const payment = Payment.create({
      id: 'pay-3',
      organizationId: 'org-1',
      type: PaymentType.INFLOW,
      amount: 1000,
    });

    expect(payment.remainingAmount).toBe(1000);
    expect(payment.allocationStatus).toBe('unallocated');

    payment.allocate({ type: 'invoice', documentId: 'inv-101', amount: 400 });
    expect(payment.remainingAmount).toBe(600);
    expect(payment.allocationStatus).toBe('partially_allocated');

    payment.allocate({ type: 'invoice', documentId: 'inv-102', amount: 600 });
    expect(payment.remainingAmount).toBe(0);
    expect(payment.allocationStatus).toBe('fully_allocated');

    expect(() => payment.allocate({ type: 'invoice', documentId: 'inv-103', amount: 50 })).toThrow(
      'exceeds remaining unallocated amount'
    );
  });

  it('should cancel payment', () => {
    const payment = Payment.create({
      id: 'pay-4',
      organizationId: 'org-1',
      type: PaymentType.INFLOW,
      amount: 250,
    });

    payment.cancel();
    expect(payment.status).toBe('cancelled');
  });

  it('should soft delete and restore payment', () => {
    const payment = Payment.create({
      id: 'pay-5',
      organizationId: 'org-1',
      type: PaymentType.INFLOW,
      amount: 150,
    });

    expect(payment.isDeleted).toBe(false);
    payment.softDelete();
    expect(payment.isDeleted).toBe(true);

    payment.restore();
    expect(payment.isDeleted).toBe(false);
  });
});
