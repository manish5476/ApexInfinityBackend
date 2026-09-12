import mongoose, { Schema, Document } from 'mongoose';

export interface IPlatformDeliveryAgentDoc extends Document {
  name: string;
  phone: string;
  password?: string;
  city: string;
  state: string;
  zipCode: string;
  isActive: boolean;
  status: 'available' | 'busy' | 'offline';
  vehicleType?: string;
  licenseNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PlatformDeliveryAgentSchema = new Schema<IPlatformDeliveryAgentDoc>(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, unique: true, trim: true },
    password: { type: String, select: false },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    zipCode: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true },
    status: { type: String, enum: ['available', 'busy', 'offline'], default: 'offline' },
    vehicleType: { type: String, trim: true },
    licenseNumber: { type: String, trim: true },
  },
  { timestamps: true }
);

export const PlatformDeliveryAgentModel =
  (mongoose.models.PlatformDeliveryAgent as mongoose.Model<IPlatformDeliveryAgentDoc>) ||
  mongoose.model<IPlatformDeliveryAgentDoc>('PlatformDeliveryAgent', PlatformDeliveryAgentSchema);
