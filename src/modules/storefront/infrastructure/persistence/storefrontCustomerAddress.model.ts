import mongoose, { Schema, Document } from "mongoose";

export interface IStorefrontCustomerAddressDoc extends Document<any, any, any> {
  _id: string;
  customerId: string;
  organizationId: string;
  storefrontId?: string | null;
  fullName: string;
  phone: string;
  country: string;
  state: string;
  city: string;
  postalCode: string;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  addressType: "home" | "work" | "billing" | "shipping" | "other";
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const StorefrontCustomerAddressSchema = new Schema<IStorefrontCustomerAddressDoc>({
  _id:            { type: String, required: true },
  customerId:     { type: String, required: true },
  organizationId: { type: String, required: true },
  storefrontId:   { type: String, default: null },
  fullName:       { type: String, required: true, trim: true },
  phone:          { type: String, required: true, trim: true },
  country:        { type: String, default: "India", trim: true },
  state:          { type: String, required: true, trim: true },
  city:           { type: String, required: true, trim: true },
  postalCode:     { type: String, required: true, trim: true },
  addressLine1:   { type: String, required: true, trim: true },
  addressLine2:   { type: String, default: "", trim: true },
  landmark:       { type: String, default: "", trim: true },
  addressType:    { type: String, enum: ["home", "work", "billing", "shipping", "other"], default: "home" },
  isDefault:      { type: Boolean, default: false },
}, { _id: false, timestamps: true });

StorefrontCustomerAddressSchema.index({ organizationId: 1, customerId: 1, isDefault: 1 });

export const StorefrontCustomerAddressModel = mongoose.model<IStorefrontCustomerAddressDoc>(
  "FwStorefrontCustomerAddress",
  StorefrontCustomerAddressSchema,
);
