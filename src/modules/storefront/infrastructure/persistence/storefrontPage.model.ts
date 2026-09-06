import mongoose, { Schema, Document } from 'mongoose';

export interface IStorefrontPageDoc extends Document<any, any, any> {
  _id: string;
  organizationId: string;
  name: string;
  slug: string;
  pageType: string;
  sections: Array<{ id: string; type: string; order: number; data: Record<string, unknown> }>;
  seo?: {
    title?: string;
    description?: string;
    keywords?: string[];
    ogImage?: string;
    noIndex?: boolean;
  };
  status: string;
  isPublished: boolean;
  publishedAt?: Date | null;
  isHomepage: boolean;
  viewCount: number;
  lastViewedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const SectionSchema = new Schema({
  id: { type: String, required: true },
  type: { type: String, required: true },
  order: { type: Number, default: 0 },
  data: { type: Schema.Types.Mixed, default: {} },
}, { _id: false });

const SeoSchema = new Schema({
  title: { type: String, maxlength: 70 },
  description: { type: String, maxlength: 160 },
  keywords: [{ type: String }],
  ogImage: { type: String },
  noIndex: { type: Boolean, default: false },
}, { _id: false });

const StorefrontPageSchema = new Schema<IStorefrontPageDoc>({
  _id: { type: String, required: true },
  organizationId: { type: String, required: true },
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, trim: true, lowercase: true },
  pageType: { type: String, required: true, default: 'custom' },
  sections: [SectionSchema],
  seo: SeoSchema,
  status: { type: String, required: true, default: 'draft' },
  isPublished: { type: Boolean, default: false },
  publishedAt: { type: Date, default: null },
  isHomepage: { type: Boolean, default: false },
  viewCount: { type: Number, default: 0 },
  lastViewedAt: { type: Date, default: null },
  createdAt: { type: Date, required: true },
  updatedAt: { type: Date, required: true },
}, { _id: false });

StorefrontPageSchema.index({ organizationId: 1, slug: 1 }, { unique: true });
StorefrontPageSchema.index({ organizationId: 1, isHomepage: 1 });
StorefrontPageSchema.index({ organizationId: 1, status: 1 });

export const StorefrontPageModel = mongoose.model<IStorefrontPageDoc>('FwStorefrontPage', StorefrontPageSchema);
