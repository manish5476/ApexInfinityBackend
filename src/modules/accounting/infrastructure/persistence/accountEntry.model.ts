import mongoose, { Schema, Document } from 'mongoose';

export interface IAccountEntryDoc extends Document<any, any, any> {
  _id: string;
  organizationId: string;
  branchId: string | null;
  accountId: string;
  customerId: string | null;
  supplierId: string | null;
  invoiceId: string | null;
  purchaseId: string | null;
  paymentId: string | null;
  date: Date;
  debit: number;
  credit: number;
  description: string | null;
  referenceNumber: string | null;
  referenceType: string | null;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const AccountEntrySchema = new Schema<IAccountEntryDoc>({
  _id: { type: String, required: true },
  organizationId: { type: String, required: true },
  branchId: { type: String, default: null },
  accountId: { type: String, required: true },
  customerId: { type: String, default: null },
  supplierId: { type: String, default: null },
  invoiceId: { type: String, default: null },
  purchaseId: { type: String, default: null },
  paymentId: { type: String, default: null },
  date: { type: Date, required: true },
  debit: { type: Number, required: true, default: 0, min: 0 },
  credit: { type: Number, required: true, default: 0, min: 0 },
  description: { type: String, default: null },
  referenceNumber: { type: String, default: null },
  referenceType: { type: String, default: null },
  createdBy: { type: String, default: null },
  createdAt: { type: Date, required: true },
  updatedAt: { type: Date, required: true },
}, { _id: false });

AccountEntrySchema.index({ organizationId: 1, date: -1 });
AccountEntrySchema.index({ organizationId: 1, accountId: 1, date: -1 });
AccountEntrySchema.index({ organizationId: 1, customerId: 1, date: -1 });
AccountEntrySchema.index({ organizationId: 1, supplierId: 1, date: -1 });
AccountEntrySchema.index({ organizationId: 1, invoiceId: 1 });
AccountEntrySchema.index({ organizationId: 1, paymentId: 1 });

export const AccountEntryModel = mongoose.model<IAccountEntryDoc>('FwAccountEntry', AccountEntrySchema);
