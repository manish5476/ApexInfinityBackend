import mongoose, { Schema, Document } from 'mongoose';

export interface IInvoiceDoc extends Document<any, any, any> {
  _id: string;
  organizationId: string;
  branchId: string | null;
  customerId: string | null;
  invoiceNumber: string;
  invoiceDate: Date;
  dueDate: Date | null;
  status: string;
  source: string;
  items: Array<{ productId: string; name: string; quantity: number; price: number; discount: number; taxRate: number; hsnCode?: string | null }>;
  subTotal: number;
  totalTax: number;
  totalDiscount: number;
  shippingCharges: number;
  roundOff: number;
  grandTotal: number;
  paymentStatus: string;
  paidAmount: number;
  balanceAmount: number;
  paymentMethod: string;
  notes: string | null;
  billingAddress: string | null;
  shippingAddress: string | null;
  isDeleted: boolean;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const InvoiceItemSchema = new Schema({
  productId: { type: String, required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true, min: 0 },
  price: { type: Number, required: true, min: 0 },
  discount: { type: Number, default: 0, min: 0 },
  taxRate: { type: Number, default: 0 },
  hsnCode: { type: String, default: null },
}, { _id: false });

const InvoiceSchema = new Schema<IInvoiceDoc>({
  _id: { type: String, required: true },
  organizationId: { type: String, required: true },
  branchId: { type: String, default: null },
  customerId: { type: String, default: null },
  invoiceNumber: { type: String, required: true },
  invoiceDate: { type: Date, required: true },
  dueDate: { type: Date, default: null },
  status: { type: String, required: true },
  source: { type: String, default: 'crm' },
  items: [InvoiceItemSchema],
  subTotal: { type: Number, default: 0 },
  totalTax: { type: Number, default: 0 },
  totalDiscount: { type: Number, default: 0 },
  shippingCharges: { type: Number, default: 0 },
  roundOff: { type: Number, default: 0 },
  grandTotal: { type: Number, required: true },
  paymentStatus: { type: String, default: 'unpaid' },
  paidAmount: { type: Number, default: 0 },
  balanceAmount: { type: Number, default: 0 },
  paymentMethod: { type: String, default: 'cash' },
  notes: { type: String, default: null },
  billingAddress: { type: String, default: null },
  shippingAddress: { type: String, default: null },
  isDeleted: { type: Boolean, default: false },
  createdBy: { type: String, default: null },
  createdAt: { type: Date, required: true },
  updatedAt: { type: Date, required: true },
}, { _id: false });

InvoiceSchema.index({ organizationId: 1, invoiceNumber: 1 }, { unique: true });
InvoiceSchema.index({ organizationId: 1, status: 1, invoiceDate: -1 });
InvoiceSchema.index({ organizationId: 1, customerId: 1 });
InvoiceSchema.index({ organizationId: 1, paymentStatus: 1 });
InvoiceSchema.index({ organizationId: 1, isDeleted: 1 });

export const InvoiceModel = mongoose.model<IInvoiceDoc>('FwInvoice', InvoiceSchema);
