export const AccountType = {
  ASSET: 'asset',
  LIABILITY: 'liability',
  EQUITY: 'equity',
  REVENUE: 'revenue',
  INCOME: 'income',
  EXPENSE: 'expense',
  OTHER: 'other',
} as const;
export type AccountType = typeof AccountType[keyof typeof AccountType];

export const InvoiceStatus = {
  DRAFT: 'draft',
  ISSUED: 'issued',
  PAID: 'paid',
  PARTIALLY_PAID: 'partially_paid',
  OVERDUE: 'overdue',
  CANCELLED: 'cancelled',
  RETURNED: 'returned',
} as const;
export type InvoiceStatus = typeof InvoiceStatus[keyof typeof InvoiceStatus];

export const PaymentMethod = {
  CASH: 'cash',
  BANK: 'bank',
  CREDIT: 'credit',
  UPI: 'upi',
  CHEQUE: 'cheque',
  OTHER: 'other',
} as const;
export type PaymentMethod = typeof PaymentMethod[keyof typeof PaymentMethod];

export const PaymentType = {
  INFLOW: 'inflow',
  OUTFLOW: 'outflow',
} as const;
export type PaymentType = typeof PaymentType[keyof typeof PaymentType];

export const AllocationStatus = {
  UNALLOCATED: 'unallocated',
  PARTIALLY_ALLOCATED: 'partially_allocated',
  FULLY_ALLOCATED: 'fully_allocated',
} as const;
export type AllocationStatus = typeof AllocationStatus[keyof typeof AllocationStatus];
