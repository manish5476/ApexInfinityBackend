import mongoose, { Schema, Document } from 'mongoose';

export interface AssetDoc extends Document {
  organizationId: mongoose.Types.ObjectId;
  uploadedBy: mongoose.Types.ObjectId;
  fileName: string;
  originalName?: string;
  mimeType?: string;
  size: number;
  publicId: string;
  url: string;
  category: string;
  provider: string;
  createdAt: Date;
  updatedAt: Date;
}

const assetSchema = new Schema(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    fileName: { type: String, required: true, trim: true },
    originalName: { type: String },
    mimeType: { type: String },
    size: { type: Number, default: 0 },
    publicId: { type: String, required: true },
    url: { type: String, required: true },
    category: {
      type: String,
      enum: ['product', 'avatar', 'invoice', 'chat', 'marketing'],
      default: 'marketing',
      index: true,
    },
    provider: {
      type: String,
      enum: ['cloudinary', 'local'],
      default: 'cloudinary',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

assetSchema.index({ organizationId: 1, fileName: 'text' });
assetSchema.index({ organizationId: 1, createdAt: -1 });

export const AssetModel = mongoose.model<AssetDoc>('Asset', assetSchema);
