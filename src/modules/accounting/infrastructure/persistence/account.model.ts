import mongoose, { Schema, Document } from 'mongoose';

export interface IAccountDoc extends Document<any, any, any> {
  _id: string;
  organizationId: string;
  code: string;
  name: string;
  type: string;
  parent: string | null;
  isGroup: boolean;
  cachedBalance: number;
  isActive: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const AccountSchema = new Schema<IAccountDoc>({
  _id: { type: String, required: true },
  organizationId: { type: String, required: true },
  code: { type: String, required: true, trim: true, uppercase: true },
  name: { type: String, required: true, trim: true },
  type: { type: String, required: true },
  parent: { type: String, default: null },
  isGroup: { type: Boolean, default: false },
  cachedBalance: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  metadata: { type: Schema.Types.Mixed, default: {} },
  createdAt: { type: Date, required: true },
  updatedAt: { type: Date, required: true },
}, { _id: false });

AccountSchema.index({ organizationId: 1, code: 1 }, { unique: true });
AccountSchema.index({ organizationId: 1, name: 1 });
AccountSchema.index({ organizationId: 1, type: 1, isGroup: 1 });
AccountSchema.index({ organizationId: 1, parent: 1 });

export const AccountModel = mongoose.model<IAccountDoc>('FwAccount', AccountSchema);
