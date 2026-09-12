import mongoose, { Schema, Document } from 'mongoose';

export interface IStorefrontCustomerDoc extends Document {
  organizationId: string;
  storefrontId?: string | null;
  email?: string | null;
  phone?: string | null;
  firstName: string;
  lastName: string;
  avatar?: string | null;
  authProvider: string;
  passwordHash?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  guestAccount: boolean;
  marketingOptIn: boolean;
  tags: string[];
  notes?: string;
  status: 'active' | 'blocked' | 'deleted';
  lastSeenAt: Date;
  lastOrderAt?: Date | null;
  orderCount: number;
  totalSpent: number;
  convertedToMainCustomer: boolean;
  linkedCustomerId?: string | null;
  crmSyncedAt?: Date | null;
  defaultAddressId?: string | null;
  wishlist: string[];
  recentlyViewed: Array<{ productId: string; viewedAt: Date }>;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const StorefrontCustomerSchema = new Schema<IStorefrontCustomerDoc>(
  {
    organizationId: { type: String, required: true, index: true },
    storefrontId: { type: String, default: null, index: true },
    email: { type: String, trim: true, lowercase: true, default: null },
    phone: { type: String, trim: true, default: null },
    firstName: { type: String, trim: true, default: '' },
    lastName: { type: String, trim: true, default: '' },
    avatar: { type: String, default: null },
    authProvider: { type: String, default: 'guest', index: true },
    passwordHash: { type: String, select: false },
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    guestAccount: { type: Boolean, default: true, index: true },
    marketingOptIn: { type: Boolean, default: false },
    tags: [{ type: String, trim: true }],
    notes: { type: String, trim: true, default: '' },
    status: { type: String, enum: ['active', 'blocked', 'deleted'], default: 'active', index: true },
    lastSeenAt: { type: Date, default: Date.now },
    lastOrderAt: { type: Date, default: null },
    orderCount: { type: Number, default: 0, min: 0 },
    totalSpent: { type: Number, default: 0, min: 0 },
    convertedToMainCustomer: { type: Boolean, default: false, index: true },
    linkedCustomerId: { type: String, default: null, index: true },
    crmSyncedAt: { type: Date, default: null },
    defaultAddressId: { type: String, default: null },
    wishlist: [{ type: String }],
    recentlyViewed: [{ productId: { type: String, required: true }, viewedAt: { type: Date, default: Date.now } }],
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

StorefrontCustomerSchema.index(
  { organizationId: 1, email: 1 },
  { unique: true, partialFilterExpression: { email: { $type: 'string', $gt: '' } } }
);
StorefrontCustomerSchema.index(
  { organizationId: 1, phone: 1 },
  { unique: true, partialFilterExpression: { phone: { $type: 'string', $gt: '' } } }
);

export const StorefrontCustomerModel =
  (mongoose.models.StorefrontCustomer as mongoose.Model<IStorefrontCustomerDoc>) ||
  mongoose.model<IStorefrontCustomerDoc>('StorefrontCustomer', StorefrontCustomerSchema);
