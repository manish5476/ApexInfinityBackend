import mongoose, { Schema, Document } from 'mongoose';

export interface AddressDoc {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

export interface GuarantorEntryDoc {
  customerId: string;
  notes?: string | null;
  addedAt: Date;
  addedBy?: string | null;
}

export interface ICustomerDoc extends Document<any, any, any> {
  _id: string;
  organizationId: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  altPhone?: string | null;
  type: string;
  contactPerson?: string | null;
  avatar?: string | null;
  gstNumber?: string | null;
  panNumber?: string | null;
  billingAddress?: AddressDoc | null;
  shippingAddress?: AddressDoc | null;
  openingBalance: number;
  outstandingBalance: number;
  creditLimit: number;
  paymentTerms?: string | null;
  notes?: string | null;
  tags: string[];
  guarantors: GuarantorEntryDoc[];
  status: string;
  isActive: boolean;
  isDeleted: boolean;
  ownerId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const AddressSchema = new Schema<AddressDoc>(
  {
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    zipCode: { type: String, trim: true },
    country: { type: String, trim: true, default: 'India' },
  },
  { _id: false }
);

const GuarantorEntrySchema = new Schema<GuarantorEntryDoc>(
  {
    customerId: { type: String, required: true },
    notes: { type: String, trim: true, default: null },
    addedAt: { type: Date, default: Date.now },
    addedBy: { type: String, default: null },
  },
  { _id: false }
);

const CustomerSchema = new Schema<ICustomerDoc>(
  {
    _id: { type: String, required: true },
    organizationId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true, default: null },
    phone: { type: String, trim: true, default: null },
    altPhone: { type: String, trim: true, default: null },
    type: { type: String, enum: ['individual', 'business'], default: 'individual' },
    contactPerson: { type: String, trim: true, default: null },
    avatar: { type: String, default: null },
    gstNumber: { type: String, trim: true, uppercase: true, default: null },
    panNumber: { type: String, trim: true, uppercase: true, default: null },
    billingAddress: { type: AddressSchema, default: null },
    shippingAddress: { type: AddressSchema, default: null },
    openingBalance: { type: Number, default: 0 },
    outstandingBalance: { type: Number, default: 0 },
    creditLimit: { type: Number, default: 0 },
    paymentTerms: { type: String, trim: true, default: null },
    notes: { type: String, trim: true, default: null },
    tags: [{ type: String, trim: true }],
    guarantors: { type: [GuarantorEntrySchema], default: [] },
    status: { type: String, default: 'active' },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    ownerId: { type: String, default: null },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
  },
  { _id: false, timestamps: false }
);

CustomerSchema.index({ organizationId: 1, email: 1 }, { sparse: true });
CustomerSchema.index({ organizationId: 1, phone: 1 }, { sparse: true });
CustomerSchema.index({ organizationId: 1, name: 1 });
CustomerSchema.index({ organizationId: 1, isActive: 1, isDeleted: 1 });
CustomerSchema.index({ organizationId: 1, 'guarantors.customerId': 1 }, { sparse: true });
CustomerSchema.index({ organizationId: 1, ownerId: 1 });

export const CustomerModel = mongoose.model<ICustomerDoc>('CrmCustomer', CustomerSchema);

