import { Schema, Connection, Model } from 'mongoose';

export interface CompanyAssetDocument {
  _id: string;
  organizationId: string;
  branchId?: string;
  assetCode: string;
  name: string;
  category: string;
  serialNumber?: string;
  manufacturer?: string;
  model?: string;
  purchaseDate?: Date;
  purchaseCost?: number;
  warrantyExpiresAt?: Date;
  condition: string;
  status: string;
  assignedTo?: string;
  employeeRef?: string;
  assignedAt?: Date;
  returnedAt?: Date;
  assignmentHistory: Array<{
    user?: string;
    employeeRef?: string;
    assignedAt: Date;
    returnedAt?: Date;
    conditionOnIssue?: string;
    conditionOnReturn?: string;
    notes?: string;
    processedBy?: string;
  }>;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const companyAssetSchema = new Schema<CompanyAssetDocument>(
  {
    _id: { type: String, required: true },
    organizationId: { type: String, required: true, index: true },
    branchId: { type: String, index: true },
    assetCode: { type: String, required: true, trim: true, uppercase: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, index: true },
    serialNumber: { type: String, trim: true },
    manufacturer: { type: String, trim: true },
    model: { type: String, trim: true },
    purchaseDate: { type: Date },
    purchaseCost: { type: Number },
    warrantyExpiresAt: { type: Date },
    condition: { type: String, default: 'good' },
    status: { type: String, default: 'available', index: true },
    assignedTo: { type: String, index: true },
    employeeRef: { type: String, index: true },
    assignedAt: { type: Date },
    returnedAt: { type: Date },
    assignmentHistory: [
      {
        _id: false,
        user: { type: String },
        employeeRef: { type: String },
        assignedAt: { type: Date, required: true },
        returnedAt: { type: Date },
        conditionOnIssue: { type: String },
        conditionOnReturn: { type: String },
        notes: { type: String },
        processedBy: { type: String },
      },
    ],
    notes: { type: String, trim: true },
  },
  {
    timestamps: true,
    _id: false,
    versionKey: false,
  }
);

companyAssetSchema.index({ organizationId: 1, assetCode: 1 }, { unique: true });

export function getCompanyAssetModel(connection: Connection): Model<CompanyAssetDocument> {
  return connection.models['CompanyAsset'] || connection.model<CompanyAssetDocument>('CompanyAsset', companyAssetSchema);
}
