import mongoose, { Schema, Document, Model } from 'mongoose';

export interface MasterDoc extends Document<any, any, any> {
  _id: string;
  organizationId: string;
  type: string;
  name: string;
  slug: string;
  code?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  parentId?: string | null;
  isActive: boolean;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface MasterTypeDoc extends Document<any, any, any> {
  _id: string;
  name: string;
  label: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const masterSchema = new Schema<MasterDoc>(
  {
    _id: { type: String, required: true },
    organizationId: { type: String, required: true, index: true },
    type: { type: String, required: true, trim: true, lowercase: true, index: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, lowercase: true, trim: true, index: true },
    code: { type: String, trim: true, uppercase: true, default: null },
    description: { type: String, trim: true, default: null },
    imageUrl: { type: String, trim: true, default: null },
    parentId: { type: String, default: null },
    isActive: { type: Boolean, default: true, index: true },
    metadata: {
      type: Schema.Types.Mixed,
      default: () => ({ isFeatured: false, sortOrder: 0 }),
    },
  },
  {
    timestamps: true,
    collection: 'fw_masters',
  }
);

masterSchema.index({ organizationId: 1, type: 1, name: 1 });
masterSchema.index({ organizationId: 1, type: 1, slug: 1 });

const masterTypeSchema = new Schema<MasterTypeDoc>(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true, trim: true, lowercase: true, unique: true },
    label: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true, index: true },
  },
  {
    timestamps: true,
    collection: 'fw_master_types',
  }
);

export const FwMaster: Model<MasterDoc> =
  mongoose.models.FwMaster || mongoose.model<MasterDoc>('FwMaster', masterSchema);

export const FwMasterType: Model<MasterTypeDoc> =
  mongoose.models.FwMasterType || mongoose.model<MasterTypeDoc>('FwMasterType', masterTypeSchema);
