import { Schema, Document, Connection, Model } from 'mongoose';

export interface GeoFenceDocument extends Document<string> {
  _id: string;
  organizationId: string;
  branchId?: string;
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  radius: number;
  assignedUsers: string[];
  assignedDepartments: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const geoFenceSchema = new Schema<GeoFenceDocument>(
  {
    _id: { type: String, required: true },
    organizationId: { type: String, required: true, index: true },
    branchId: { type: String, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    radius: { type: Number, default: 100 },
    assignedUsers: [{ type: String }],
    assignedDepartments: [{ type: String }],
    isActive: { type: Boolean, default: true, index: true },
  },
  {
    timestamps: true,
    _id: false,
    versionKey: false,
  }
);

geoFenceSchema.index({ organizationId: 1, name: 1 });

export function getGeoFenceModel(connection: Connection): Model<GeoFenceDocument> {
  return connection.models['GeoFence'] || connection.model<GeoFenceDocument>('GeoFence', geoFenceSchema);
}
