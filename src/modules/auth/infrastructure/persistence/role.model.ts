import { Schema, Document, Connection, Model } from 'mongoose';

export interface RoleDocument extends Document {
  _id: string;
  organizationId: string;
  name: string;
  description?: string;
  permissions: string[];
  isSuperAdmin: boolean;
  isDefault: boolean;
  isActive: boolean;
  isDeleted: boolean;
  createdBy?: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const RoleSchema = new Schema<RoleDocument>(
  {
    _id: { type: String, required: true },
    organizationId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    permissions: { type: [String], default: [] },
    isSuperAdmin: { type: Boolean, default: false },
    isDefault: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true, index: true },
    isDeleted: { type: Boolean, default: false, index: true },
    createdBy: { type: String },
    updatedBy: { type: String },
  },
  {
    timestamps: true,
    _id: false,
  }
);

RoleSchema.index({ organizationId: 1, name: 1 }, { unique: true });
RoleSchema.index({ organizationId: 1, isActive: 1, isDeleted: 1 });

export function getRoleModel(connection: Connection): Model<RoleDocument> {
  return (
    (connection.models.Role as Model<RoleDocument>) ||
    connection.model<RoleDocument>('Role', RoleSchema)
  );
}
