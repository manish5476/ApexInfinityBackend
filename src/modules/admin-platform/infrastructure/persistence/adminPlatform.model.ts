import mongoose, { Schema, Document } from 'mongoose';

export interface FeatureFlagDoc extends Document {
  organizationId?: mongoose.Types.ObjectId | null;
  key: string;
  name: string;
  description?: string;
  enabled: boolean;
  rules?: Record<string, unknown>;
  updatedBy?: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const featureFlagSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', default: null, index: true },
    key: { type: String, required: true, trim: true, lowercase: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    enabled: { type: Boolean, default: false, index: true },
    rules: { type: Schema.Types.Mixed, default: {} },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

featureFlagSchema.index({ organizationId: 1, key: 1 }, { unique: true });

export const FeatureFlagModel = mongoose.model<FeatureFlagDoc>('FeatureFlag', featureFlagSchema);

export interface PlatformSettingDoc extends Document {
  organizationId?: mongoose.Types.ObjectId | null;
  namespace: string;
  key: string;
  value: unknown;
  encrypted?: boolean;
  description?: string;
  updatedBy?: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const platformSettingSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', default: null, index: true },
    namespace: { type: String, required: true, trim: true, lowercase: true, index: true },
    key: { type: String, required: true, trim: true, lowercase: true },
    value: { type: Schema.Types.Mixed, required: true },
    encrypted: { type: Boolean, default: false },
    description: { type: String, trim: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

platformSettingSchema.index({ organizationId: 1, namespace: 1, key: 1 }, { unique: true });

export const PlatformSettingModel = mongoose.model<PlatformSettingDoc>('PlatformSetting', platformSettingSchema);

export interface PlatformAuditDoc extends Document {
  organizationId?: mongoose.Types.ObjectId | null;
  actorId?: mongoose.Types.ObjectId | null;
  action: string;
  resource: string;
  resourceId?: string;
  before?: unknown;
  after?: unknown;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
  createdAt: Date;
}

const platformAuditSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', default: null, index: true },
    actorId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    action: {
      type: String,
      required: true,
      enum: [
        'CREATE',
        'UPDATE',
        'DELETE',
        'LOGIN',
        'LOGOUT',
        'EXPORT',
        'IMPERSONATE',
        'CONFIG_CHANGE',
        'SECURITY_EVENT',
        'INTERNAL_TOOL',
      ],
      index: true,
    },
    resource: { type: String, required: true, trim: true, index: true },
    resourceId: { type: String, trim: true, index: true },
    before: { type: Schema.Types.Mixed },
    after: { type: Schema.Types.Mixed },
    metadata: { type: Schema.Types.Mixed, default: {} },
    ipAddress: { type: String },
    userAgent: { type: String },
    requestId: { type: String, index: true },
  },
  { timestamps: true },
);

platformAuditSchema.index({ organizationId: 1, createdAt: -1 });
platformAuditSchema.index({ actorId: 1, createdAt: -1 });
platformAuditSchema.index({ resource: 1, resourceId: 1, createdAt: -1 });

export const PlatformAuditModel = mongoose.model<PlatformAuditDoc>('PlatformAudit', platformAuditSchema);
