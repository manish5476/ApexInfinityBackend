import { IPaymentRepository, ListPaymentsQuery } from '../../domain/ports/IPaymentRepository';
import { Payment } from '../../domain/entities/Payment';

export class InMemoryPaymentRepository implements IPaymentRepository {
  public payments: Payment[] = [];

  async findById(query: { id: string; organizationId: string }): Promise<Payment | null> {
    const p = this.payments.find(x => x.id === query.id && x.organizationId === query.organizationId);
    return p ? Payment.reconstitute({ ...p.props, id: p.id }) : null;
  }

  async findByCustomerId(query: { customerId: string; organizationId: string }): Promise<Payment[]> {
    return this.payments
      .filter(x => x.customerId === query.customerId && x.organizationId === query.organizationId && !x.isDeleted)
      .map(p => Payment.reconstitute({ ...p.props, id: p.id }));
  }

  async findByInvoiceId(query: { invoiceId: string; organizationId: string }): Promise<Payment[]> {
    return this.payments
      .filter(x => x.invoiceId === query.invoiceId && x.organizationId === query.organizationId && !x.isDeleted)
      .map(p => Payment.reconstitute({ ...p.props, id: p.id }));
  }

  async save(payment: Payment): Promise<void> {
    const idx = this.payments.findIndex(x => x.id === payment.id);
    if (idx >= 0) {
      this.payments[idx] = Payment.reconstitute({ ...payment.props, id: payment.id });
    } else {
      this.payments.push(Payment.reconstitute({ ...payment.props, id: payment.id }));
    }
  }

  async list(query: ListPaymentsQuery): Promise<{ data: Payment[]; total: number }> {
    let filtered = this.payments.filter(x => x.organizationId === query.organizationId);

    if (query.isDeleted !== undefined) {
      filtered = filtered.filter(x => x.isDeleted === query.isDeleted);
    } else {
      filtered = filtered.filter(x => !x.isDeleted);
    }

    if (query.customerId) {
      filtered = filtered.filter(x => x.customerId === query.customerId);
    }
    if (query.supplierId) {
      filtered = filtered.filter(x => x.supplierId === query.supplierId);
    }
    if (query.invoiceId) {
      filtered = filtered.filter(x => x.invoiceId === query.invoiceId);
    }
    if (query.branchId) {
      filtered = filtered.filter(x => x.branchId === query.branchId);
    }
    if (query.type) {
      filtered = filtered.filter(x => x.type === query.type);
    }
    if (query.status) {
      filtered = filtered.filter(x => x.status === query.status);
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const start = (page - 1) * limit;
    return {
      data: filtered.slice(start, start + limit).map(x => Payment.reconstitute({ ...x.props, id: x.id })),
      total: filtered.length,
    };
  }
}
