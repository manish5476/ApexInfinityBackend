import mongoose, { Schema, Document } from 'mongoose';

export interface IStorefrontCouponDoc extends Document {
  organizationId: string;
  code: string;
  discountType: 'fixed' | 'percentage' | 'shipping';
  amount: number;
  maxDiscount?: number | null;
  minPurchaseAmount: number;
  startDate?: Date | null;
  endDate?: Date | null;
  usageLimit?: number | null;
  usedCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const StorefrontCouponSchema = new Schema<IStorefrontCouponDoc>(
  {
    organizationId: { type: String, required: true, index: true },
    code: { type: String, trim: true, uppercase: true, required: true },
    discountType: { type: String, enum: ['fixed', 'percentage', 'shipping'], default: 'fixed' },
    amount: { type: Number, required: true, default: 0 },
    maxDiscount: { type: Number, default: null },
    minPurchaseAmount: { type: Number, default: 0 },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    usageLimit: { type: Number, default: null },
    usedCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

StorefrontCouponSchema.index({ organizationId: 1, code: 1 }, { unique: true });

export const StorefrontCouponModel =
  (mongoose.models.StorefrontCoupon as mongoose.Model<IStorefrontCouponDoc>) ||
  mongoose.model<IStorefrontCouponDoc>('StorefrontCoupon', StorefrontCouponSchema);
