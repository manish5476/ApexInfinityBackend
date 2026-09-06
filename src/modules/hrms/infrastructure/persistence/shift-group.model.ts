import { Schema, Document, Connection, Model } from 'mongoose';

export interface ShiftGroupDocument extends Document<string> {
  _id: string;
  organizationId: string;
  branchId?: string;
  name: string;
  code: string;
  description?: string;
  shifts: Array<{
    shiftId: string;
    sequence: number;
    color?: string;
  }>;
  rotationType: 'daily' | 'weekly' | 'monthly' | 'custom';
  rotationPattern: Array<{
    dayOffset: number;
    shiftId: string;
  }>;
  applicableDepartments: string[];
  applicableDesignations: string[];
  isActive: boolean;
  effectiveFrom?: Date;
  effectiveTo?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const shiftGroupSchema = new Schema<ShiftGroupDocument>(
  {
    _id: { type: String, required: true },
    organizationId: { type: String, required: true, index: true },
    branchId: { type: String, index: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true, uppercase: true },
    description: { type: String, trim: true },
    shifts: [
      {
        _id: false,
        shiftId: { type: String, required: true },
        sequence: { type: Number, required: true },
        color: { type: String },
      },
    ],
    rotationType: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'custom'],
      default: 'weekly',
    },
    rotationPattern: [
      {
        _id: false,
        dayOffset: { type: Number, required: true },
        shiftId: { type: String, required: true },
      },
    ],
    applicableDepartments: [{ type: String }],
    applicableDesignations: [{ type: String }],
    isActive: { type: Boolean, default: true, index: true },
    effectiveFrom: { type: Date },
    effectiveTo: { type: Date },
  },
  {
    timestamps: true,
    _id: false,
    versionKey: false,
  }
);

shiftGroupSchema.index({ organizationId: 1, code: 1 }, { unique: true });

export function getShiftGroupModel(connection: Connection): Model<ShiftGroupDocument> {
  return connection.models['ShiftGroup'] || connection.model<ShiftGroupDocument>('ShiftGroup', shiftGroupSchema);
}
