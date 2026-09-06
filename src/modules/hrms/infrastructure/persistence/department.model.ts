import { Schema, Document, Connection, Model } from 'mongoose';

export interface DepartmentDocument extends Document<string> {
  _id: string;
  organizationId: string;
  name: string;
  code: string;
  description?: string;
  parentId?: string;
  managerId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const departmentSchema = new Schema<DepartmentDocument>(
  {
    _id: { type: String, required: true },
    organizationId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true, uppercase: true },
    description: { type: String, trim: true },
    parentId: { type: String, index: true },
    managerId: { type: String },
    isActive: { type: Boolean, default: true, index: true },
  },
  {
    timestamps: true,
    _id: false,
    versionKey: false,
  }
);

departmentSchema.index({ organizationId: 1, code: 1 }, { unique: true });
departmentSchema.index({ organizationId: 1, isActive: 1 });

export function getDepartmentModel(connection: Connection): Model<DepartmentDocument> {
  return connection.models['Department'] || connection.model<DepartmentDocument>('Department', departmentSchema);
}
