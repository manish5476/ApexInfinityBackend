import { z } from 'zod';

export const createAccountSchema = z.object({
  body: z.object({
    code: z.string().min(1, 'Account code is required'),
    name: z.string().min(1, 'Account name is required'),
    type: z.enum(['asset', 'liability', 'equity', 'revenue', 'income', 'expense', 'other']),
    parent: z.string().nullable().optional(),
    isGroup: z.boolean().optional(),
    metadata: z.record(z.any()).optional(),
  }),
});

export const updateAccountSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Account ID is required'),
  }),
  body: z.object({
    name: z.string().min(1).optional(),
    type: z.enum(['asset', 'liability', 'equity', 'revenue', 'income', 'expense', 'other']).optional(),
    isActive: z.boolean().optional(),
    metadata: z.record(z.any()).optional(),
  }),
});

export const reparentAccountSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Account ID is required'),
  }),
  body: z.object({
    newParentId: z.string().nullable(),
  }),
});

export const createInvoiceSchema = z.object({
  body: z.object({
    branchId: z.string().nullable().optional(),
    customerId: z.string().nullable().optional(),
    invoiceNumber: z.string().min(1, 'Invoice number is required'),
    dueDate: z.string().optional(),
    source: z.enum(['crm', 'storefront', 'pos']).optional(),
    items: z.array(
      z.object({
        productId: z.string().min(1, 'Product ID is required'),
        name: z.string().min(1, 'Product name is required'),
        quantity: z.number().min(0, 'Quantity must be non-negative'),
        price: z.number().min(0, 'Price must be non-negative'),
        discount: z.number().min(0).optional(),
        taxRate: z.number().min(0).optional(),
        hsnCode: z.string().nullable().optional(),
      })
    ).min(1, 'At least one line item is required'),
    shippingCharges: z.number().min(0).optional(),
    roundOff: z.number().optional(),
    paymentMethod: z.enum(['cash', 'bank', 'credit', 'upi', 'cheque', 'other']).optional(),
    notes: z.string().nullable().optional(),
    billingAddress: z.string().nullable().optional(),
    shippingAddress: z.string().nullable().optional(),
  }),
});

export const updateInvoiceSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Invoice ID is required'),
  }),
  body: z.object({
    dueDate: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),
    billingAddress: z.string().nullable().optional(),
    shippingAddress: z.string().nullable().optional(),
    paymentMethod: z.enum(['cash', 'bank', 'credit', 'upi', 'cheque', 'other']).optional(),
  }),
});

export const recordPaymentSchema = z.object({
  body: z.object({
    invoiceId: z.string().min(1, 'Invoice ID is required'),
    amount: z.number().min(0.01, 'Payment amount must be greater than zero'),
    paymentMethod: z.enum(['cash', 'bank', 'credit', 'upi', 'cheque', 'other']).optional(),
    referenceNumber: z.string().nullable().optional(),
    transactionId: z.string().nullable().optional(),
    bankName: z.string().nullable().optional(),
    remarks: z.string().nullable().optional(),
  }),
});

export const createPaymentSchema = z.object({
  body: z.object({
    branchId: z.string().nullable().optional(),
    type: z.enum(['inflow', 'outflow']),
    customerId: z.string().nullable().optional(),
    supplierId: z.string().nullable().optional(),
    invoiceId: z.string().nullable().optional(),
    purchaseId: z.string().nullable().optional(),
    amount: z.number().min(0.01, 'Payment amount must be greater than zero'),
    paymentMethod: z.enum(['cash', 'bank', 'credit', 'upi', 'cheque', 'other']).optional(),
    referenceNumber: z.string().nullable().optional(),
    transactionId: z.string().nullable().optional(),
    bankName: z.string().nullable().optional(),
    remarks: z.string().nullable().optional(),
  }),
});

export const idParamSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'ID is required'),
  }),
});

export const customerIdParamSchema = z.object({
  params: z.object({
    customerId: z.string().min(1, 'Customer ID is required'),
  }),
});
