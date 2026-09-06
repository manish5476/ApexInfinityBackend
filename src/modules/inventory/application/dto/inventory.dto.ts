import { ProductInventoryEntry } from '../../domain/entities/Product';

export interface ProductResponseDto {
  id: string;
  organizationId: string;
  name: string;
  slug?: string | null;
  description?: string | null;
  sku?: string | null;
  barcode?: string | null;
  hsnCode?: string | null;
  categoryId?: string | null;
  subCategoryId?: string | null;
  brandId?: string | null;
  unitId?: string | null;
  purchasePrice: number;
  sellingPrice: number;
  mrp?: number | null;
  discountedPrice?: number | null;
  taxRate: number;
  isTaxInclusive: boolean;
  status: string;
  inventory: ProductInventoryEntry[];
  defaultSupplierId?: string | null;
  tags: string[];
  images: string[];
  isDeleted: boolean;
  totalStock: number;
  availableStock: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductDto {
  name: string;
  description?: string | null;
  sku?: string | null;
  barcode?: string | null;
  hsnCode?: string | null;
  categoryId?: string | null;
  purchasePrice?: number;
  sellingPrice: number;
  mrp?: number | null;
  taxRate?: number;
  defaultSupplierId?: string | null;
  tags?: string[];
  images?: string[];
}

export interface UpdateProductDto {
  name?: string;
  description?: string | null;
  sku?: string | null;
  barcode?: string | null;
  hsnCode?: string | null;
  categoryId?: string | null;
  purchasePrice?: number;
  sellingPrice?: number;
  mrp?: number | null;
  taxRate?: number;
  defaultSupplierId?: string | null;
  tags?: string[];
  images?: string[];
  status?: string;
}

export interface AdjustStockDto {
  productId: string;
  branchId: string;
  delta: number;
  reason?: string;
}

export interface TransferStockDto {
  productId: string;
  fromBranchId: string;
  toBranchId: string;
  quantity: number;
}

export interface BulkUpdateProductItemDto {
  id: string;
  data: UpdateProductDto;
}

export interface BulkUpdateProductsDto {
  items: BulkUpdateProductItemDto[];
}

export interface ListProductsQueryDto {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string | null;
  status?: string;
  isDeleted?: boolean;
}

export interface SalesOrderResponseDto {
  id: string;
  organizationId: string;
  branchId: string;
  customerId?: string | null;
  invoiceId?: string | null;
  status: string;
  items: Array<{
    productId: string;
    name: string;
    quantity: number;
    price: number;
    taxRate: number;
    discount: number;
  }>;
  subTotal: number;
  totalTax: number;
  totalDiscount: number;
  grandTotal: number;
  paymentStatus: string;
  paidAmount: number;
  balanceAmount: number;
  notes?: string | null;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrderResponseDto {
  id: string;
  organizationId: string;
  branchId: string;
  supplierId: string;
  supplierName?: string | null;
  invoiceNumber?: string | null;
  purchaseDate: string;
  dueDate?: string | null;
  status: string;
  items: Array<{
    productId: string;
    name: string;
    quantity: number;
    purchasePrice: number;
    taxRate: number;
    discount: number;
  }>;
  subTotal: number;
  totalTax: number;
  totalDiscount: number;
  grandTotal: number;
  paymentStatus: string;
  paidAmount: number;
  balanceAmount: number;
  notes?: string | null;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
}
