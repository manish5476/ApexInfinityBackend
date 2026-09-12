import mongoose, { Schema, Document } from 'mongoose';

export interface IStorefrontLayoutDoc extends Document {
  organizationId: string;
  theme: string;
  header: Record<string, any>;
  footer: Record<string, any>;
  sections: any[];
  customCss?: string;
  settings: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const StorefrontLayoutSchema = new Schema<IStorefrontLayoutDoc>(
  {
    organizationId: { type: String, required: true, unique: true, index: true },
    theme: { type: String, default: 'default' },
    header: { type: Schema.Types.Mixed, default: {} },
    footer: { type: Schema.Types.Mixed, default: {} },
    sections: { type: [Schema.Types.Mixed] as any, default: [] },
    customCss: { type: String, default: '' },
    settings: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

export const StorefrontLayoutModel =
  (mongoose.models.StorefrontLayout as mongoose.Model<IStorefrontLayoutDoc>) ||
  mongoose.model<IStorefrontLayoutDoc>('StorefrontLayout', StorefrontLayoutSchema);
