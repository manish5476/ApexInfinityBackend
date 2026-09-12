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
    primaryEmail: { type: String },
    primaryPhone: { type: String },
    gstNumber: { type: String },
    uniqueShopId: { type: String },
    logo: { type: String },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: { type: String, default: 'India' },
    },
    settings: {
      currency: { type: String, default: 'INR' },
      timezone: { type: String, default: 'Asia/Kolkata' },
      financialYearStart: { type: String, default: '04-01' },
    },
  },
  {
    timestamps: true,
    _id: false, // We supply custom string UUIDs
  }
);

// Indexes
OrganizationSchema.index({ name: 'text' });
OrganizationSchema.index({ uniqueShopId: 1 }, { sparse: true });

export function getOrganizationModel(connection: Connection): Model<OrganizationDocument> {
  return (
    (connection.models.Organization as Model<OrganizationDocument>) ||
    connection.model<OrganizationDocument>('Organization', OrganizationSchema)
  );
}

export const OrganizationModel =
  (mongoose.models.Organization as Model<OrganizationDocument>) ||
  mongoose.model<OrganizationDocument>('Organization', OrganizationSchema);

