import mongoose, { Schema, Document } from 'mongoose';

export interface IPurchaseOrderDoc extends Document<any, any, any> {
  _id: string;
  organizationId: string;
  branchId: string;
  supplierId: string;
  supplierName: string | null;
  invoiceNumber: string | null;
  purchaseDate: Date;
  dueDate: Date | null;
  status: string;
  items: Array<{ productId: string; name: string; quantity: number; purchasePrice: number; taxRate: number; discount: number }>;
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

const PurchaseItemSchema = new Schema({
  productId: { type: String, required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  purchasePrice: { type: Number, required: true, min: 0 },
  taxRate: { type: Number, default: 0 },
  discount: { type: Number, default: 0, min: 0 },
}, { _id: false });

const PurchaseOrderSchema = new Schema<IPurchaseOrderDoc>({
  _id: { type: String, required: true },
  organizationId: { type: String, required: true },
  branchId: { type: String, required: true },
  supplierId: { type: String, required: true },
  supplierName: { type: String, default: null },
  invoiceNumber: { type: String, default: null },
  purchaseDate: { type: Date, required: true },
  dueDate: { type: Date, default: null },
  status: { type: String, required: true },
  items: [PurchaseItemSchema],
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

PurchaseOrderSchema.index({ organizationId: 1, supplierId: 1 });
PurchaseOrderSchema.index({ organizationId: 1, status: 1 });

export const PurchaseOrderModel = mongoose.model<IPurchaseOrderDoc>('FwPurchaseOrder', PurchaseOrderSchema);
