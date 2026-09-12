import mongoose, { Schema, Document } from 'mongoose';

export interface IProductDoc extends Document<any, any, any> {
  _id: string;
  organizationId: string;
  name: string;
  slug: string | null;
  description: string | null;
  sku: string | null;
  barcode: string | null;
  hsnCode: string | null;
  categoryId: string | null;
  subCategoryId: string | null;
  brandId: string | null;
  unitId: string | null;
  purchasePrice: number;
  sellingPrice: number;
  mrp: number | null;
  discountedPrice: number | null;
  taxRate: number;
  isTaxInclusive: boolean;
  status: string;
  /** Whether this product is visible on the public storefront. Defaults to true.
   *  Allows hiding a product from the storefront without deactivating it in inventory. */
  storefrontVisible: boolean;
  inventory: Array<{ branchId: string; quantity: number; reservedQuantity: number; reorderLevel: number; rackLocation?: string | null }>;
  defaultSupplierId: string | null;
  tags: string[];
  images: string[];
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}


const InventoryEntrySchema = new Schema({
  branchId: { type: String, required: true },
  quantity: { type: Number, default: 0, min: 0 },
  reservedQuantity: { type: Number, default: 0, min: 0 },
  reorderLevel: { type: Number, default: 10, min: 0 },
  rackLocation: { type: String, default: null },
}, { _id: false });

const ProductSchema = new Schema<IProductDoc>({
  _id: { type: String, required: true },
  organizationId: { type: String, required: true },
  name: { type: String, required: true },
  slug: { type: String, default: null },
  description: { type: String, default: null },
  sku: { type: String, default: null },
  barcode: { type: String, default: null },
  hsnCode: { type: String, default: null },
  categoryId: { type: String, default: null },
  subCategoryId: { type: String, default: null },
  brandId: { type: String, default: null },
  unitId: { type: String, default: null },
  purchasePrice: { type: Number, default: 0 },
  sellingPrice: { type: Number, required: true },
  mrp: { type: Number, default: null },
  discountedPrice: { type: Number, default: null },
  taxRate: { type: Number, default: 0 },
  isTaxInclusive: { type: Boolean, default: false },
  status: { type: String, required: true },
  storefrontVisible: { type: Boolean, default: true },
  inventory: [InventoryEntrySchema],
  defaultSupplierId: { type: String, default: null },
  tags: [{ type: String }],
  images: [{ type: String }],
  isDeleted: { type: Boolean, default: false },
  createdAt: { type: Date, required: true },
  updatedAt: { type: Date, required: true },
}, { _id: false });

ProductSchema.index({ organizationId: 1, sku: 1 }, { unique: true, sparse: true });
ProductSchema.index({ organizationId: 1, barcode: 1 }, { sparse: true });
ProductSchema.index({ organizationId: 1, status: 1 });
ProductSchema.index({ organizationId: 1, isDeleted: 1 });
ProductSchema.index({ organizationId: 1, name: 1 });
// Storefront public listing: covers the canonical storefront query filter
ProductSchema.index({ organizationId: 1, status: 1, storefrontVisible: 1, isDeleted: 1 });


export const ProductModel = mongoose.model<IProductDoc>('FwProduct', ProductSchema);

