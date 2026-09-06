import { Schema, Document, Connection, Model } from 'mongoose';

export interface ShiftDocument extends Document<string> {
  _id: string;
  organizationId: string;
  name: string;
  code: string;
  startTime: string;
  endTime: string;
  gracePeriodMins: number;
  halfDayThresholdHours: number;
  minFullDayHours: number;
  unpaidBreakMins: number;
  weeklyOffs: number[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const shiftSchema = new Schema<ShiftDocument>(
  {
    _id: { type: String, required: true },
    organizationId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true, uppercase: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    gracePeriodMins: { type: Number, default: 15 },
    halfDayThresholdHours: { type: Number, default: 4.5 },
    minFullDayHours: { type: Number, default: 8.0 },
    unpaidBreakMins: { type: Number, default: 60 },
    weeklyOffs: { type: [Number], default: [0, 6] },
    isActive: { type: Boolean, default: true, index: true },
  },
  {
    timestamps: true,
    _id: false,
    versionKey: false,
  }
);

shiftSchema.index({ organizationId: 1, code: 1 }, { unique: true });

export function getShiftModel(connection: Connection): Model<ShiftDocument> {
  return connection.models['Shift'] || connection.model<ShiftDocument>('Shift', shiftSchema);
}
