import mongoose, { Schema, Document } from 'mongoose';

export interface ISalesOrderDoc extends Document<any, any, any> {
  _id: string;
  organizationId: string;
  branchId: string;
  customerId: string | null;
  invoiceId: string | null;
  status: string;
  items: Array<{ productId: string; name: string; quantity: number; price: number; taxRate: number; discount: number }>;
  subTotal: number;
  totalTax: number;
  totalDiscount: number;
  grandTotal: number;
  paymentStatus: string;
  paidAmount: number;
  balanceAmount: number;
  notes: string | null;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const SalesOrderItemSchema = new Schema({
  productId: { type: String, required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true, min: 0 },
  taxRate: { type: Number, default: 0 },
  discount: { type: Number, default: 0, min: 0 },
}, { _id: false });

const SalesOrderSchema = new Schema<ISalesOrderDoc>({
  _id: { type: String, required: true },
  organizationId: { type: String, required: true },
  branchId: { type: String, required: true },
  customerId: { type: String, default: null },
  invoiceId: { type: String, default: null },
  status: { type: String, required: true },
  items: [SalesOrderItemSchema],
  subTotal: { type: Number, default: 0 },
  totalTax: { type: Number, default: 0 },
  totalDiscount: { type: Number, default: 0 },
  grandTotal: { type: Number, required: true },
  paymentStatus: { type: String, default: 'unpaid' },
  paidAmount: { type: Number, default: 0 },
  balanceAmount: { type: Number, default: 0 },
  notes: { type: String, default: null },
  createdBy: { type: String, default: null },
  createdAt: { type: Date, required: true },
  updatedAt: { type: Date, required: true },
}, { _id: false });

SalesOrderSchema.index({ organizationId: 1, customerId: 1 });
SalesOrderSchema.index({ organizationId: 1, status: 1 });

export const SalesOrderModel = mongoose.model<ISalesOrderDoc>('FwSalesOrder', SalesOrderSchema);
