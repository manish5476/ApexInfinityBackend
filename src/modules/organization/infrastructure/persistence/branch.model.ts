import { Schema, Document, Connection, Model } from 'mongoose';

export interface BranchPersistenceData {
  _id: string;
  organizationId: string;
  name: string;
  branchCode: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  phone?: string;
  email?: string;
  isMainBranch: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface BranchDocument extends Document<string>, BranchPersistenceData {
  _id: string;
}

export const BranchSchema = new Schema<BranchDocument>(
  {
    _id: { type: String, required: true },
    organizationId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    branchCode: { type: String, required: true, trim: true, uppercase: true },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: { type: String, default: 'India' },
    },
    phone: { type: String },
    email: { type: String },
    isMainBranch: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    _id: false,
  }
);

BranchSchema.index({ organizationId: 1, branchCode: 1 }, { unique: true });
BranchSchema.index({ organizationId: 1, isMainBranch: 1 });

export function getBranchModel(connection: Connection): Model<BranchDocument> {
  return (
    (connection.models.FwBranch as Model<BranchDocument>) ||
    connection.model<BranchDocument>('FwBranch', BranchSchema)
  );
}
