import { Invoice } from '../entities/Invoice';

export interface ListInvoicesQuery {
  organizationId: string;
  branchId?: string;
  customerId?: string | null;
  status?: string | null;
  paymentStatus?: string | null;
  search?: string;
  isDeleted?: boolean;
  fromDate?: Date;
  toDate?: Date;
  page?: number;
  limit?: number;
}

export interface IInvoiceRepository {
  findById(query: { id: string; organizationId: string }): Promise<Invoice | null>;
  findByInvoiceNumber(query: { invoiceNumber: string; organizationId: string }): Promise<Invoice | null>;
  findByCustomerId(query: { customerId: string; organizationId: string; limit?: number }): Promise<Invoice[]>;
  findOutstanding(query: { organizationId: string; customerId?: string }): Promise<Invoice[]>;
  save(invoice: Invoice): Promise<void>;
  list(query: ListInvoicesQuery): Promise<{ data: Invoice[]; total: number }>;
}
