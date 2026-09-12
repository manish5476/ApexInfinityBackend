import mongoose, { Schema, Document } from 'mongoose';

export interface IStorefrontDeliveryAgentDoc extends Document {
  organizationId: string;
  staffId?: string | null;
  name: string;
  phone: string;
  email: string;
  password?: string;
  vehicleType: string;
  vehicleRegistrationNumber: string;
  alternatePhone?: string;
  isActive: boolean;
  assignedOrders: string[];
  lastActiveAt?: Date | null;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const StorefrontDeliveryAgentSchema = new Schema<IStorefrontDeliveryAgentDoc>(
  {
    organizationId: { type: String, required: true, index: true },
    staffId: { type: String, default: null },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    password: { type: String, select: false },
    vehicleType: { type: String, trim: true, default: 'Bike' },
    vehicleRegistrationNumber: { type: String, trim: true, default: '' },
    alternatePhone: { type: String, trim: true, default: '' },
    isActive: { type: Boolean, default: true },
    assignedOrders: [{ type: String }],
    lastActiveAt: { type: Date, default: null },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

StorefrontDeliveryAgentSchema.index({ organizationId: 1, phone: 1 }, { unique: true });
StorefrontDeliveryAgentSchema.index({ organizationId: 1, email: 1 });

export const StorefrontDeliveryAgentModel =
  (mongoose.models.StorefrontDeliveryAgent as mongoose.Model<IStorefrontDeliveryAgentDoc>) ||
  mongoose.model<IStorefrontDeliveryAgentDoc>('StorefrontDeliveryAgent', StorefrontDeliveryAgentSchema);
