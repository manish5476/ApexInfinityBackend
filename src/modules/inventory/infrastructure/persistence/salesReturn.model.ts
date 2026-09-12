import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISalesReturnItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  taxAmount: number;
  discountAmount: number;
  refundAmount: number;
}

export interface ISalesReturnDoc extends Document<any, any, any> {
  _id: string;
  organizationId: string;
  branchId?: string | null;
  invoiceId: string;
  customerId?: string | null;
  returnNumber: string;
  returnDate: Date;
  items: ISalesReturnItem[];
  subTotal: number;
  taxTotal: number;
  discountTotal: number;
  totalRefundAmount: number;
  reason: string;
  notes?: string | null;
  status: 'pending' | 'approved' | 'rejected';
  source: 'crm' | 'storefront_request';
  refundMethod?: string | null;
  approvedBy?: string | null;
  approvedAt?: Date | null;
  rejectedBy?: string | null;
  rejectedAt?: Date | null;
  rejectionReason?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const SalesReturnItemSchema = new Schema<ISalesReturnItem>({
  productId: { type: String, required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
  taxAmount: { type: Number, default: 0, min: 0 },
  discountAmount: { type: Number, default: 0, min: 0 },
  refundAmount: { type: Number, required: true, min: 0 },
}, { _id: false });

const SalesReturnSchema = new Schema<ISalesReturnDoc>({
  _id: { type: String, required: true },
  organizationId: { type: String, required: true, index: true },
  branchId: { type: String, default: null, index: true },
  invoiceId: { type: String, required: true, index: true },
  customerId: { type: String, default: null, index: true },
  returnNumber: { type: String, required: true },
  returnDate: { type: Date, default: Date.now },
  items: [SalesReturnItemSchema],
  subTotal: { type: Number, default: 0 },
  taxTotal: { type: Number, default: 0 },
  discountTotal: { type: Number, default: 0 },
  totalRefundAmount: { type: Number, required: true, min: 0 },
  reason: { type: String, required: true, trim: true },
  notes: { type: String, trim: true, default: null },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
    index: true,
  },
  source: {
    type: String,
    enum: ['crm', 'storefront_request'],
    default: 'crm',
  },
  refundMethod: {
    type: String,
    enum: ['credit_note', 'cash', 'upi', 'bank_transfer', null],
    default: null,
  },
  approvedBy: { type: String, default: null },
  approvedAt: { type: Date, default: null },
  rejectedBy: { type: String, default: null },
  rejectedAt: { type: Date, default: null },
  rejectionReason: { type: String, default: null },
}, {
  timestamps: true,
});

// Compound indexes for high-performance querying
SalesReturnSchema.index({ organizationId: 1, status: 1 });
SalesReturnSchema.index({ organizationId: 1, customerId: 1 });
SalesReturnSchema.index({ organizationId: 1, returnDate: -1 });

export function getSalesReturnModel(connection: mongoose.Connection): Model<ISalesReturnDoc> {
  return connection.models.SalesReturn || connection.model<ISalesReturnDoc>('SalesReturn', SalesReturnSchema);
}
