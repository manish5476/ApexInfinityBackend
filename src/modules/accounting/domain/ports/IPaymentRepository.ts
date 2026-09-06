import { Payment } from '../entities/Payment';
import { PaymentType } from '../value-objects/AccountingEnums';

export interface ListPaymentsQuery {
  organizationId: string;
  branchId?: string;
  customerId?: string | null;
  supplierId?: string | null;
  invoiceId?: string | null;
  type?: PaymentType;
  status?: string;
  isDeleted?: boolean;
  page?: number;
  limit?: number;
}

export interface IPaymentRepository {
  findById(query: { id: string; organizationId: string }): Promise<Payment | null>;
  findByCustomerId(query: { customerId: string; organizationId: string }): Promise<Payment[]>;
  findByInvoiceId(query: { invoiceId: string; organizationId: string }): Promise<Payment[]>;
  save(payment: Payment): Promise<void>;
  list(query: ListPaymentsQuery): Promise<{ data: Payment[]; total: number }>;
}
