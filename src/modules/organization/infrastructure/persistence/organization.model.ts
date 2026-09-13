import mongoose, { Schema, Document, Connection, Model } from 'mongoose';
import { OrganizationPersistenceData } from '../../application/mappers/OrganizationMapper';

export interface OrganizationDocument extends Document<string>, OrganizationPersistenceData {
  _id: string;
}

export const OrganizationSchema = new Schema<OrganizationDocument>(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    isActive: { type: Boolean, default: true },
    primaryEmail: { type: String, trim: true, lowercase: true },
    primaryPhone: { type: String, trim: true },
    gstNumber: { type: String, trim: true, uppercase: true },
    uniqueShopId: { type: String, required: true, unique: true, uppercase: true, trim: true },
    logo: { type: String },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: { type: String, default: 'India' },
    },
    settings: {
      currency: { type: String, default: 'INR', uppercase: true },
      timezone: { type: String, default: 'Asia/Kolkata' },
      financialYearStart: { type: String, default: 'April' },
    },
    owner: { type: String, required: true },
    mainBranch: { type: String },
    branches: { type: [String], default: [] },
    secondaryEmail: { type: String, trim: true, lowercase: true },
    secondaryPhone: { type: String, trim: true },
    features: {
      whatsappEnabled: { type: Boolean, default: true }
    },
    platformDelivery: {
      enabled: { type: Boolean, default: false }
    },
    whatsappWallet: {
      credits: { type: Number, default: 0 }
    },
    superAdminRole: { type: String, default: 'superadmin' }
  },
  {
    timestamps: true,
    _id: false, // We supply custom string UUIDs
  }
);

// Indexes
OrganizationSchema.index({ name: 'text' });

export function getOrganizationModel(connection: Connection): Model<OrganizationDocument> {
  return (
    (connection.models.Organization as Model<OrganizationDocument>) ||
    connection.model<OrganizationDocument>('Organization', OrganizationSchema)
  );
}

export const OrganizationModel =
  (mongoose.models.Organization as Model<OrganizationDocument>) ||
  mongoose.model<OrganizationDocument>('Organization', OrganizationSchema);
