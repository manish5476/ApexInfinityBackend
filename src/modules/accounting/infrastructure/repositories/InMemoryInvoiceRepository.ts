import { IInvoiceRepository, ListInvoicesQuery } from '../../domain/ports/IInvoiceRepository';
import { Invoice } from '../../domain/entities/Invoice';

export class InMemoryInvoiceRepository implements IInvoiceRepository {
  public invoices: Invoice[] = [];

  async findById(query: { id: string; organizationId: string }): Promise<Invoice | null> {
    const inv = this.invoices.find(x => x.id === query.id && x.organizationId === query.organizationId);
    return inv ? Invoice.reconstitute({ ...inv.props, id: inv.id }) : null;
  }

  async findByInvoiceNumber(query: { invoiceNumber: string; organizationId: string }): Promise<Invoice | null> {
    const inv = this.invoices.find(
      x => x.invoiceNumber === query.invoiceNumber.toUpperCase().trim() && x.organizationId === query.organizationId
    );
    return inv ? Invoice.reconstitute({ ...inv.props, id: inv.id }) : null;
  }

  async findByCustomerId(query: { customerId: string; organizationId: string; limit?: number }): Promise<Invoice[]> {
    const limit = query.limit ?? 50;
    const filtered = this.invoices.filter(
      x => x.customerId === query.customerId && x.organizationId === query.organizationId && !x.isDeleted
    );
    return filtered.slice(0, limit).map(x => Invoice.reconstitute({ ...x.props, id: x.id }));
  }

  async findOutstanding(query: { organizationId: string; customerId?: string }): Promise<Invoice[]> {
    let filtered = this.invoices.filter(
      x => x.organizationId === query.organizationId && !x.isDeleted && x.balanceAmount > 0 && x.status !== 'cancelled'
    );
    if (query.customerId) {
      filtered = filtered.filter(x => x.customerId === query.customerId);
    }
    return filtered.map(x => Invoice.reconstitute({ ...x.props, id: x.id }));
  }

  async save(invoice: Invoice): Promise<void> {
    const idx = this.invoices.findIndex(x => x.id === invoice.id);
    if (idx >= 0) {
      this.invoices[idx] = Invoice.reconstitute({ ...invoice.props, id: invoice.id });
    } else {
      this.invoices.push(Invoice.reconstitute({ ...invoice.props, id: invoice.id }));
    }
  }

  async list(query: ListInvoicesQuery): Promise<{ data: Invoice[]; total: number }> {
    let filtered = this.invoices.filter(x => x.organizationId === query.organizationId);

    if (query.isDeleted !== undefined) {
      filtered = filtered.filter(x => x.isDeleted === query.isDeleted);
    } else {
      filtered = filtered.filter(x => !x.isDeleted);
    }

    if (query.status) {
      filtered = filtered.filter(x => x.status === query.status);
    }

    if (query.paymentStatus) {
      filtered = filtered.filter(x => x.paymentStatus === query.paymentStatus);
    }

    if (query.customerId) {
      filtered = filtered.filter(x => x.customerId === query.customerId);
    }

    if (query.branchId) {
      filtered = filtered.filter(x => x.branchId === query.branchId);
    }

    if (query.search) {
      const s = query.search.toLowerCase().trim();
      filtered = filtered.filter(x => x.invoiceNumber.toLowerCase().includes(s));
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const start = (page - 1) * limit;
    return {
      data: filtered.slice(start, start + limit).map(x => Invoice.reconstitute({ ...x.props, id: x.id })),
      total: filtered.length,
    };
  }
}
