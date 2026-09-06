import { Schema, Document, Connection, Model } from 'mongoose';

export interface HolidayDocument extends Document<string> {
  _id: string;
  organizationId: string;
  branchId?: string;
  name: string;
  date: Date;
  year: number;
  description?: string;
  holidayType: string;
  isOptional: boolean;
  recurring?: {
    isRecurring: boolean;
    frequency: string;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const holidaySchema = new Schema<HolidayDocument>(
  {
    _id: { type: String, required: true },
    organizationId: { type: String, required: true, index: true },
    branchId: { type: String, index: true },
    name: { type: String, required: true, trim: true },
    date: { type: Date, required: true, index: true },
    year: { type: Number, required: true, index: true },
    description: { type: String, trim: true },
    holidayType: { type: String, default: 'company' },
    isOptional: { type: Boolean, default: false },
    recurring: {
      isRecurring: { type: Boolean, default: false },
      frequency: { type: String, default: 'yearly' },
    },
    isActive: { type: Boolean, default: true, index: true },
  },
  {
    timestamps: true,
    _id: false,
    versionKey: false,
  }
);

holidaySchema.index({ organizationId: 1, year: 1 });

export function getHolidayModel(connection: Connection): Model<HolidayDocument> {
  return connection.models['Holiday'] || connection.model<HolidayDocument>('Holiday', holidaySchema);
}
