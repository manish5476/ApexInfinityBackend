import mongoose, { Schema, Document } from 'mongoose';

export interface IPaymentDoc extends Document<any, any, any> {
  _id: string;
  organizationId: string;
  branchId: string | null;
  type: string;
  customerId: string | null;
  supplierId: string | null;
  invoiceId: string | null;
  purchaseId: string | null;
  paymentDate: Date;
  referenceNumber: string | null;
  amount: number;
  remainingAmount: number;
  paymentMethod: string;
  transactionId: string | null;
  bankName: string | null;
  remarks: string | null;
  status: string;
  allocationStatus: string;
  allocatedTo: Array<{ type: string; documentId: string; amount: number; allocatedAt: Date }>;
  isDeleted: boolean;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const AllocationSchema = new Schema({
  type: { type: String, required: true },
  documentId: { type: String, required: true },
  amount: { type: Number, required: true },
  allocatedAt: { type: Date, default: Date.now },
}, { _id: false });

const PaymentSchema = new Schema<IPaymentDoc>({
  _id: { type: String, required: true },
  organizationId: { type: String, required: true },
  branchId: { type: String, default: null },
  type: { type: String, required: true },
  customerId: { type: String, default: null },
  supplierId: { type: String, default: null },
  invoiceId: { type: String, default: null },
  purchaseId: { type: String, default: null },
  paymentDate: { type: Date, required: true },
  referenceNumber: { type: String, default: null },
  amount: { type: Number, required: true, min: 0.01 },
  remainingAmount: { type: Number, min: 0 },
  paymentMethod: { type: String, default: 'cash' },
  transactionId: { type: String, default: null },
  bankName: { type: String, default: null },
  remarks: { type: String, default: null },
  status: { type: String, default: 'completed' },
  allocationStatus: { type: String, default: 'unallocated' },
  allocatedTo: [AllocationSchema],
  isDeleted: { type: Boolean, default: false },
  createdBy: { type: String, default: null },
  createdAt: { type: Date, required: true },
  updatedAt: { type: Date, required: true },
}, { _id: false });

PaymentSchema.index({ organizationId: 1, type: 1 });
PaymentSchema.index({ organizationId: 1, customerId: 1 });
PaymentSchema.index({ organizationId: 1, invoiceId: 1 });
PaymentSchema.index({ organizationId: 1, paymentDate: -1 });
PaymentSchema.index({ organizationId: 1, isDeleted: 1 });

export const PaymentModel = mongoose.model<IPaymentDoc>('FwPayment', PaymentSchema);
