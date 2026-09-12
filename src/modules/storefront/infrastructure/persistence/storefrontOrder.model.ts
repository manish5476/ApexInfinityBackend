import mongoose, { Schema, Document } from 'mongoose';

// ─── Sub-document interfaces ──────────────────────────────────────────────────

export interface IOrderAddress {
  fullName: string;
  phone: string;
  country?: string;
  state: string;
  city: string;
  postalCode: string;
  addressLine1?: string;
  addressLine2?: string;
  landmark?: string;
  /** Flattened "street" alias – kept for backward compat with the domain entity */
  street?: string;
}

export interface IOrderItem {
  productId: string;
  variantId?: string | null;
  branchId?: string | null;
  /** Immutable price snapshot captured at order-placement time */
  snapshot: {
    name: string;
    sku?: string | null;
    image?: string | null;
    sellingPrice: number;
    taxRate?: number;
    isTaxInclusive?: boolean;
    hsnCode?: string | null;
  };
  quantity: number;
  unitPrice: number;
  discountAmount?: number;
  taxAmount?: number;
  lineTotal: number;
  /** Legacy flat field still used by some display layers */
  name?: string;
}

export interface IOrderTimeline {
  type: string;
  message: string;
  at: Date;
  actorId?: string | null;
  metadata?: Record<string, unknown>;
}

export interface IOrderTotals {
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  grandTotal: number;
  currency?: string;
}

export interface IStorefrontOrderDoc extends Document<any, any, any> {
  _id: string;
  organizationId: string;
  storefrontId?: string | null;
  /** Null until the CRM bridge service links the order */
  crmInvoiceId?: string | null;
  crmSaleId?: string | null;
  crmCustomerId?: string | null;
  crmSyncStatus: 'pending' | 'synced' | 'failed' | 'pending_phone';
  crmSyncError?: string | null;
  customerId?: string | null;
  sessionId?: string | null;
  cartId?: string | null;
  guestOrder: boolean;
  orderNumber: string;
  customerEmail: string;
  customerPhone?: string | null;
  billingAddress: IOrderAddress;
  shippingAddress: IOrderAddress;
  items: IOrderItem[];
  totals: IOrderTotals;
  totalAmount: number;
  appliedCoupons: string[];
  paymentMethod: 'COD' | 'ONLINE' | 'CARD' | 'UPI' | 'WALLET' | 'BANK_TRANSFER';
  paymentStatus: 'pending' | 'authorized' | 'paid' | 'failed' | 'partially_refunded' | 'refunded';
  /** High-level lifecycle status */
  status: string;
  /** Separate fulfillment-track status */
  fulfillmentStatus: 'unfulfilled' | 'partial' | 'fulfilled' | 'shipped' | 'delivered' | 'returned';
  /** Merchant-assigned delivery agent (own staff) */
  deliveryAgentId?: string | null;
  /** Apex platform delivery agent */
  platformDeliveryAgentId?: string | null;
  fulfilledBy: 'merchant' | 'platform';
  deliveryFee: number;
  trackingNumber?: string;
  carrierName?: string;
  deliveryNotes?: string;
  estimatedDeliveryDate?: Date | null;
  timeline: IOrderTimeline[];
  notes?: string;
  internalNotes?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Sub-document schemas ─────────────────────────────────────────────────────

const AddressSchema = new Schema<IOrderAddress>({
  fullName:    { type: String, trim: true },
  phone:       { type: String, trim: true },
  country:     { type: String, trim: true, default: 'India' },
  state:       { type: String, trim: true },
  city:        { type: String, trim: true },
  postalCode:  { type: String, trim: true },
  addressLine1: { type: String, trim: true },
  addressLine2: { type: String, trim: true, default: '' },
  landmark:    { type: String, trim: true, default: '' },
  street:      { type: String, trim: true, default: '' },
}, { _id: false });

const SnapshotSchema = new Schema({
  name:           { type: String, required: true },
  sku:            { type: String, default: null },
  image:          { type: String, default: null },
  sellingPrice:   { type: Number, required: true },
  taxRate:        { type: Number, default: 0 },
  isTaxInclusive: { type: Boolean, default: false },
  hsnCode:        { type: String, default: null },
}, { _id: false });

const OrderItemSchema = new Schema<IOrderItem>({
  productId:     { type: String, required: true },
  variantId:     { type: String, default: null },
  branchId:      { type: String, default: null },
  snapshot:      { type: SnapshotSchema, required: true },
  quantity:      { type: Number, required: true, min: 1 },
  unitPrice:     { type: Number, required: true },
  discountAmount: { type: Number, default: 0 },
  taxAmount:     { type: Number, default: 0 },
  lineTotal:     { type: Number, required: true },
  /** Flat alias for legacy display layers */
  name:          { type: String, default: '' },
}, { _id: true });

const TimelineSchema = new Schema<IOrderTimeline>({
  type:     { type: String, required: true },
  message:  { type: String, required: true },
  at:       { type: Date, default: Date.now },
  actorId:  { type: String, default: null },
  metadata: { type: Schema.Types.Mixed, default: {} },
}, { _id: false });

const TotalsSchema = new Schema<IOrderTotals>({
  subtotal:   { type: Number, default: 0 },
  discount:   { type: Number, default: 0 },
  shipping:   { type: Number, default: 0 },
  tax:        { type: Number, default: 0 },
  grandTotal: { type: Number, default: 0 },
  currency:   { type: String, default: 'INR' },
}, { _id: false });

// ─── Main schema ──────────────────────────────────────────────────────────────

const StorefrontOrderSchema = new Schema<IStorefrontOrderDoc>({
  _id:              { type: String, required: true },
  organizationId:   { type: String, required: true },
  storefrontId:     { type: String, default: null },

  // CRM bridge — set by StorefrontCRMBridgeService; do NOT set manually
  crmInvoiceId:     { type: String, default: null },
  crmSaleId:        { type: String, default: null },
  crmCustomerId:    { type: String, default: null },
  crmSyncStatus:    { type: String, enum: ['pending', 'synced', 'failed', 'pending_phone'], default: 'pending' },
  crmSyncError:     { type: String, default: null },

  customerId:       { type: String, default: null },
  sessionId:        { type: String, default: null },
  cartId:           { type: String, default: null },
  guestOrder:       { type: Boolean, default: false },
  orderNumber:      { type: String, required: true },
  customerEmail:    { type: String, required: true },
  customerPhone:    { type: String, default: null },

  billingAddress:  { type: AddressSchema, required: true },
  shippingAddress: { type: AddressSchema, required: true },
  items:           { type: [OrderItemSchema], required: true },
  totals:          { type: TotalsSchema, required: true },
  totalAmount:     { type: Number, default: 0 },
  appliedCoupons:  { type: [String], default: [] },

  paymentMethod:   {
    type: String,
    enum: ['COD', 'ONLINE', 'CARD', 'UPI', 'WALLET', 'BANK_TRANSFER'],
    default: 'COD',
  },
  paymentStatus:   {
    type: String,
    enum: ['pending', 'authorized', 'paid', 'failed', 'partially_refunded', 'refunded'],
    default: 'pending',
  },
  status:          { type: String, required: true, default: 'placed' },
  fulfillmentStatus: {
    type: String,
    enum: ['unfulfilled', 'partial', 'fulfilled', 'shipped', 'delivered', 'returned'],
    default: 'unfulfilled',
  },

  deliveryAgentId:         { type: String, default: null },
  platformDeliveryAgentId: { type: String, default: null },
  fulfilledBy:             { type: String, enum: ['merchant', 'platform'], default: 'merchant' },
  deliveryFee:             { type: Number, default: 0 },
  trackingNumber:          { type: String, trim: true, default: '' },
  carrierName:             { type: String, trim: true, default: '' },
  deliveryNotes:           { type: String, trim: true, default: '' },
  estimatedDeliveryDate:   { type: Date, default: null },

  timeline:      { type: [TimelineSchema], default: [] },
  notes:         { type: String, trim: true, default: '' },
  internalNotes: { type: String, trim: true, default: '' },
  metadata:      { type: Schema.Types.Mixed, default: {} },
}, { _id: false, timestamps: true });

// Pre-save: keep totalAmount in sync with totals.grandTotal; auto-set timeline entry on creation
StorefrontOrderSchema.pre('save', function (next) {
  if (this.totals?.grandTotal != null) {
    this.totalAmount = this.totals.grandTotal;
  }
  if (this.totals?.shipping != null) {
    this.deliveryFee = this.totals.shipping;
  }
  if (this.isNew && this.timeline.length === 0) {
    (this.timeline as IOrderTimeline[]).push({ type: 'order_placed', message: 'Order placed', at: new Date() });
  }
  next();
});

// ─── Indexes ──────────────────────────────────────────────────────────────────
StorefrontOrderSchema.index({ organizationId: 1, orderNumber: 1 }, { unique: true });
StorefrontOrderSchema.index({ organizationId: 1, createdAt: -1 });
StorefrontOrderSchema.index({ organizationId: 1, status: 1, createdAt: -1 });
StorefrontOrderSchema.index({ organizationId: 1, customerId: 1, createdAt: -1 });
StorefrontOrderSchema.index({ organizationId: 1, guestOrder: 1, createdAt: -1 });
StorefrontOrderSchema.index({ organizationId: 1, crmSyncStatus: 1 });
StorefrontOrderSchema.index({ organizationId: 1, deliveryAgentId: 1 });
StorefrontOrderSchema.index({ organizationId: 1, fulfillmentStatus: 1 });

export const StorefrontOrderModel = mongoose.model<IStorefrontOrderDoc>('FwStorefrontOrder', StorefrontOrderSchema);



