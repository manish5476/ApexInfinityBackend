import mongoose, { Schema, Document } from 'mongoose';

export interface ShipmentDoc extends Document {
  organizationId: mongoose.Types.ObjectId;
  businessId?: mongoose.Types.ObjectId | null;
  storeId?: mongoose.Types.ObjectId | null;
  shopId?: mongoose.Types.ObjectId | null;
  warehouseId?: mongoose.Types.ObjectId | null;
  shipmentNumber: string;
  trackingNumber: string;
  sourceType: string;
  sourceId?: mongoose.Types.ObjectId | null;
  sourceNumber?: string;
  fulfillmentMode: string;
  providerId?: mongoose.Types.ObjectId | null;
  partnerId?: mongoose.Types.ObjectId | null;
  assignedDriverId?: mongoose.Types.ObjectId | null;
  assignedVehicleId?: mongoose.Types.ObjectId | null;
  status: string;
  priority: string;
  serviceLevel: string;
  slaDeadlineAt?: Date | null;
  scheduledPickupAt?: Date | null;
  promisedDeliveryAt?: Date | null;
  pickupAddress: Record<string, unknown>;
  dropoffAddress: Record<string, unknown>;
  returnAddress?: Record<string, unknown> | null;
  parcels: Array<Record<string, unknown>>;
  cod: {
    enabled: boolean;
    amount: number;
    collected: boolean;
    collectedAt?: Date | null;
  };
  customer: {
    name?: string;
    phone?: string;
    email?: string;
  };
  lastEventType?: string;
  lastEventAt?: Date | null;
  notes?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const coordinateSchema = new Schema({
  lat: { type: Number, default: null },
  lng: { type: Number, default: null },
}, { _id: false });

const addressSchema = new Schema({
  label: { type: String, trim: true, default: '' },
  fullName: { type: String, trim: true, default: '' },
  phone: { type: String, trim: true, default: '' },
  country: { type: String, trim: true, default: 'India' },
  state: { type: String, trim: true, default: '' },
  city: { type: String, trim: true, default: '' },
  postalCode: { type: String, trim: true, default: '' },
  addressLine1: { type: String, trim: true, default: '' },
  addressLine2: { type: String, trim: true, default: '' },
  landmark: { type: String, trim: true, default: '' },
  coordinates: { type: coordinateSchema, default: () => ({}) },
}, { _id: false });

const parcelSchema = new Schema({
  sku: { type: String, trim: true, default: '' },
  description: { type: String, trim: true, default: '' },
  quantity: { type: Number, min: 1, default: 1 },
  weightGrams: { type: Number, min: 0, default: 0 },
  lengthCm: { type: Number, min: 0, default: 0 },
  widthCm: { type: Number, min: 0, default: 0 },
  heightCm: { type: Number, min: 0, default: 0 },
  declaredValue: { type: Number, min: 0, default: 0 },
}, { _id: true });

const shipmentSchema = new Schema({
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  businessId: { type: Schema.Types.ObjectId, default: null, index: true },
  storeId: { type: Schema.Types.ObjectId, default: null, index: true },
  shopId: { type: Schema.Types.ObjectId, default: null, index: true },
  warehouseId: { type: Schema.Types.ObjectId, default: null, index: true },

  shipmentNumber: { type: String, required: true, unique: true, index: true },
  trackingNumber: { type: String, trim: true, index: true, default: '' },

  sourceType: {
    type: String,
    enum: ['storefront_order', 'sales_order', 'invoice', 'return', 'transfer', 'manual'],
    default: 'manual',
    index: true,
  },
  sourceId: { type: Schema.Types.ObjectId, default: null, index: true },
  sourceNumber: { type: String, trim: true, default: '' },

  fulfillmentMode: {
    type: String,
    enum: ['merchant_internal', 'platform_partner', 'hybrid_ranked', 'manual_external', 'pickup_only'],
    default: 'merchant_internal',
    index: true,
  },
  providerId: { type: Schema.Types.ObjectId, default: null, index: true },
  partnerId: { type: Schema.Types.ObjectId, default: null, index: true },
  assignedDriverId: { type: Schema.Types.ObjectId, default: null, index: true },
  assignedVehicleId: { type: Schema.Types.ObjectId, default: null, index: true },

  status: {
    type: String,
    default: 'draft',
    index: true,
  },
  priority: { type: String, enum: ['low', 'normal', 'high', 'urgent'], default: 'normal', index: true },
  serviceLevel: { type: String, enum: ['standard', 'express', 'same_day', 'scheduled'], default: 'standard', index: true },
  slaDeadlineAt: { type: Date, default: null, index: true },
  scheduledPickupAt: { type: Date, default: null, index: true },
  promisedDeliveryAt: { type: Date, default: null, index: true },

  pickupAddress: { type: addressSchema, required: true },
  dropoffAddress: { type: addressSchema, required: true },
  returnAddress: { type: addressSchema, default: null },
  parcels: { type: [parcelSchema], default: [] },

  cod: {
    enabled: { type: Boolean, default: false },
    amount: { type: Number, min: 0, default: 0 },
    collected: { type: Boolean, default: false },
    collectedAt: { type: Date, default: null },
  },

  customer: {
    name: { type: String, trim: true, default: '' },
    phone: { type: String, trim: true, default: '' },
    email: { type: String, trim: true, lowercase: true, default: '' },
  },

  lastEventType: { type: String, trim: true, default: '' },
  lastEventAt: { type: Date, default: null },
  notes: { type: String, trim: true, default: '' },
  metadata: { type: Schema.Types.Mixed, default: {} },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

shipmentSchema.index({ organizationId: 1, status: 1, createdAt: -1 });
shipmentSchema.index({ organizationId: 1, trackingNumber: 1 });
shipmentSchema.index({ organizationId: 1, sourceType: 1, sourceId: 1 });

export const ShipmentModel = mongoose.model<ShipmentDoc>('LogisticsShipment', shipmentSchema);

// Activity Schema
const shipmentActivitySchema = new Schema({
  organizationId: { type: Schema.Types.ObjectId, required: true, index: true },
  shipmentId: { type: Schema.Types.ObjectId, required: true, index: true },
  type: { type: String, required: true },
  title: { type: String, required: true },
  body: { type: String, default: '' },
  actorId: { type: Schema.Types.ObjectId, default: null },
  actorName: { type: String, default: '' },
  metadata: { type: Schema.Types.Mixed, default: {} },
}, { timestamps: true });

export const ShipmentActivityModel = mongoose.model('LogisticsShipmentActivity', shipmentActivitySchema);

// Event Schema
const shipmentEventSchema = new Schema({
  organizationId: { type: Schema.Types.ObjectId, required: true, index: true },
  aggregateId: { type: Schema.Types.ObjectId, required: true, index: true },
  eventType: { type: String, required: true },
  sequence: { type: Number, required: true },
  actorId: { type: Schema.Types.ObjectId, default: null },
  fromStatus: { type: String, default: '' },
  toStatus: { type: String, default: '' },
  reason: { type: String, default: '' },
  payload: { type: Schema.Types.Mixed, default: {} },
}, { timestamps: true });

export const ShipmentEventModel = mongoose.model('LogisticsShipmentEvent', shipmentEventSchema);
