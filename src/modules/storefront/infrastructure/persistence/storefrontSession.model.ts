import mongoose, { Schema, Document } from "mongoose";

export interface IStorefrontSessionDoc extends Document<any, any, any> {
  _id: string;
  organizationId: string;
  storefrontId?: string | null;
  sessionTokenHash: string;
  customerId?: string | null;
  cartId?: string | null;
  userAgent?: string;
  ipAddress?: string;
  pageViews: number;
  lastSeenAt: Date;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const StorefrontSessionSchema = new Schema<IStorefrontSessionDoc>({
  _id:              { type: String, required: true },
  organizationId:   { type: String, required: true },
  storefrontId:     { type: String, default: null },
  sessionTokenHash: { type: String, required: true },
  customerId:       { type: String, default: null },
  cartId:           { type: String, default: null },
  userAgent:        { type: String, default: "" },
  ipAddress:        { type: String, default: "" },
  pageViews:        { type: Number, default: 1 },
  lastSeenAt:       { type: Date, default: Date.now },
  expiresAt:        { type: Date, required: true },
}, { _id: false, timestamps: true });

StorefrontSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
StorefrontSessionSchema.index({ organizationId: 1, sessionTokenHash: 1 }, { unique: true });
StorefrontSessionSchema.index({ organizationId: 1, customerId: 1 });

export const StorefrontSessionModel = mongoose.model<IStorefrontSessionDoc>(
  "FwStorefrontSession",
  StorefrontSessionSchema,
);
