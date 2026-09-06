import mongoose, { Schema, Document } from 'mongoose';

export interface IStorefrontOrderDoc extends Document<any, any, any> {
  _id: string;
  organizationId: string;
  orderNumber: string;
  customerId: string | null;
  customerEmail: string;
  customerPhone: string | null;
  items: Array<{ productId: string; name: string; quantity: number; unitPrice: number; lineTotal: number }>;
  shippingAddress: {
    fullName: string;
    phone: string;
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country?: string;
  };
  totals: {
    subtotal: number;
    discount: number;
    shipping: number;
    tax: number;
    grandTotal: number;
  };
  status: string;
  paymentStatus: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema({
  productId: { type: String, required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true },
  lineTotal: { type: Number, required: true },
}, { _id: false });

const ShippingAddressSchema = new Schema({
  fullName: { type: String, required: true },
  phone: { type: String, required: true },
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  postalCode: { type: String, required: true },
  country: { type: String, default: 'India' },
}, { _id: false });

const TotalsSchema = new Schema({
  subtotal: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  shipping: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  grandTotal: { type: Number, required: true },
}, { _id: false });

const StorefrontOrderSchema = new Schema<IStorefrontOrderDoc>({
  _id: { type: String, required: true },
  organizationId: { type: String, required: true },
  orderNumber: { type: String, required: true },
  customerId: { type: String, default: null },
  customerEmail: { type: String, required: true },
  customerPhone: { type: String, default: null },
  items: [OrderItemSchema],
  shippingAddress: ShippingAddressSchema,
  totals: TotalsSchema,
  status: { type: String, required: true, default: 'pending' },
  paymentStatus: { type: String, required: true, default: 'unpaid' },
  createdAt: { type: Date, required: true },
  updatedAt: { type: Date, required: true },
}, { _id: false });

StorefrontOrderSchema.index({ organizationId: 1, orderNumber: 1 }, { unique: true });
StorefrontOrderSchema.index({ organizationId: 1, createdAt: -1 });

export const StorefrontOrderModel = mongoose.model<IStorefrontOrderDoc>('FwStorefrontOrder', StorefrontOrderSchema);
