import { AccountType, InvoiceStatus, PaymentMethod, PaymentType, AllocationStatus } from '../../domain/value-objects/AccountingEnums';
import { InvoiceLineItem } from '../../domain/entities/Invoice';
import { PaymentAllocation } from '../../domain/entities/Payment';

export interface AccountResponseDto {
  id: string;
  organizationId: string;
  code: string;
  name: string;
  type: AccountType;
  parent: string | null;
  isGroup: boolean;
  cachedBalance: number;
  isActive: boolean;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAccountDto {
  code: string;
  name: string;
  type: AccountType;
  parent?: string | null;
  isGroup?: boolean;
  metadata?: Record<string, any>;
}

export interface UpdateAccountDto {
  name?: string;
  type?: AccountType;
  isActive?: boolean;
  metadata?: Record<string, any>;
}

export interface InvoiceResponseDto {
  id: string;
  organizationId: string;
  branchId?: string | null;
  customerId?: string | null;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string | null;
  status: InvoiceStatus;
  source: 'crm' | 'storefront' | 'pos';
  items: InvoiceLineItem[];
  subTotal: number;
  totalTax: number;
  totalDiscount: number;
  shippingCharges: number;
  roundOff: number;
  grandTotal: number;
  paymentStatus: 'unpaid' | 'partial' | 'paid';
  paidAmount: number;
  balanceAmount: number;
  paymentMethod: PaymentMethod;
  notes?: string | null;
  billingAddress?: string | null;
  shippingAddress?: string | null;
  isDeleted: boolean;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInvoiceDto {
  branchId?: string | null;
  customerId?: string | null;
  invoiceNumber: string;
  dueDate?: string | null;
  source?: 'crm' | 'storefront' | 'pos';
  items: InvoiceLineItem[];
  shippingCharges?: number;
  roundOff?: number;
  paymentMethod?: PaymentMethod;
  notes?: string | null;
  billingAddress?: string | null;
  shippingAddress?: string | null;
}

export interface UpdateInvoiceDto {
  dueDate?: string | null;
  notes?: string | null;
  billingAddress?: string | null;
  shippingAddress?: string | null;
  paymentMethod?: PaymentMethod;
}

export interface PaymentResponseDto {
  id: string;
  organizationId: string;
  branchId?: string | null;
  type: PaymentType;
  customerId?: string | null;
  supplierId?: string | null;
  invoiceId?: string | null;
  purchaseId?: string | null;
  paymentDate: string;
  referenceNumber?: string | null;
  amount: number;
  remainingAmount: number;
  paymentMethod: PaymentMethod;
  transactionId?: string | null;
  bankName?: string | null;
  remarks?: string | null;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  allocationStatus: AllocationStatus;
  allocatedTo: PaymentAllocation[];
  isDeleted: boolean;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentDto {
  branchId?: string | null;
  type: PaymentType;
  customerId?: string | null;
  supplierId?: string | null;
  invoiceId?: string | null;
  purchaseId?: string | null;
  amount: number;
  paymentMethod?: PaymentMethod;
  referenceNumber?: string | null;
  transactionId?: string | null;
  bankName?: string | null;
  remarks?: string | null;
}

export interface LedgerEntryResponseDto {
  id: string;
  organizationId: string;
  branchId?: string | null;
  accountId: string;
  customerId?: string | null;
  supplierId?: string | null;
  invoiceId?: string | null;
  purchaseId?: string | null;
  paymentId?: string | null;
  date: string;
  debit: number;
  credit: number;
  description?: string | null;
  referenceNumber?: string | null;
  referenceType?: string | null;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerInvoiceSummaryDto {
  customerId: string;
  totalInvoices: number;
  totalBilled: number;
  totalPaid: number;
  totalOutstanding: number;
}
