import { Schema, Document, Connection, Model } from 'mongoose';

export interface DesignationDocument extends Document<string> {
  _id: string;
  organizationId: string;
  title: string;
  code: string;
  departmentId?: string;
  level: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const designationSchema = new Schema<DesignationDocument>(
  {
    _id: { type: String, required: true },
    organizationId: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true, uppercase: true },
    departmentId: { type: String, index: true },
    level: { type: Number, default: 1 },
    isActive: { type: Boolean, default: true, index: true },
  },
  {
    timestamps: true,
    _id: false,
    versionKey: false,
  }
);

designationSchema.index({ organizationId: 1, code: 1 }, { unique: true });
designationSchema.index({ organizationId: 1, departmentId: 1 });

export function getDesignationModel(connection: Connection): Model<DesignationDocument> {
  return connection.models['Designation'] || connection.model<DesignationDocument>('Designation', designationSchema);
}
