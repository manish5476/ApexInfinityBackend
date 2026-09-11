import { Schema, Document, Connection, Model } from 'mongoose';

export interface SupplierDocument extends Document {
  _id: string;
  organizationId: string;
  companyName: string;
  contactPerson?: string;
  contacts?: Array<{
    _id?: string;
    name?: string;
    department?: string;
    phone?: string;
    email?: string;
    isPrimary?: boolean;
  }>;
  avatar?: string;
  category?: string;
  categoryId?: string;
  tags?: string[];
  email?: string;
  phone?: string;
  altPhone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  gstNumber?: string;
  panNumber?: string;
  bankDetails?: {
    accountName?: string;
    accountNumber?: string;
    bankName?: string;
    ifscCode?: string;
    branch?: string;
  };
  documents?: Array<{
    _id?: string;
    docType: string;
    url: string;
    public_id?: string;
    assetId?: string;
    uploadedAt?: Date;
    verified?: boolean;
  }>;
  openingBalance: number;
  outstandingBalance: number;
  paymentTerms?: string;
  creditLimit: number;
  isActive: boolean;
  isDeleted: boolean;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const SupplierSchema = new Schema<SupplierDocument>(
  {
    _id: { type: String, required: true },
    organizationId: { type: String, required: true, index: true },
    companyName: { type: String, required: true, trim: true },
    contactPerson: { type: String, trim: true },
    contacts: [
      {
        name: { type: String, trim: true },
        department: { type: String, default: 'Other' },
        phone: { type: String, trim: true },
        email: { type: String, trim: true, lowercase: true },
        isPrimary: { type: Boolean, default: false },
      },
    ],
    avatar: { type: String },
    category: { type: String, trim: true },
    categoryId: { type: String, index: true },
    tags: [{ type: String, trim: true }],
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    altPhone: { type: String, trim: true },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: { type: String, default: 'India' },
    },
    gstNumber: { type: String, trim: true, uppercase: true },
    panNumber: { type: String, trim: true, uppercase: true },
    bankDetails: {
      accountName: String,
      accountNumber: String,
      bankName: String,
      ifscCode: String,
      branch: String,
    },
    documents: [
      {
        docType: { type: String, required: true },
        url: { type: String, required: true },
        public_id: String,
        assetId: String,
        uploadedAt: { type: Date, default: Date.now },
        verified: { type: Boolean, default: false },
      },
    ],
    openingBalance: { type: Number, default: 0 },
    outstandingBalance: { type: Number, default: 0 },
    paymentTerms: { type: String, trim: true },
    creditLimit: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true, index: true },
    isDeleted: { type: Boolean, default: false, index: true },
    createdBy: { type: String },
  },
  {
    timestamps: true,
    _id: false,
  }
);

SupplierSchema.index({ organizationId: 1, isDeleted: 1 });
SupplierSchema.index({ companyName: 'text', contactPerson: 'text', email: 'text', phone: 'text' });

export function getSupplierModel(connection: Connection): Model<SupplierDocument> {
  return (
    (connection.models.Supplier as Model<SupplierDocument>) ||
    connection.model<SupplierDocument>('Supplier', SupplierSchema)
  );
}
