import { Product } from '../entities/Product';

export interface ListProductsQuery {
  organizationId: string;
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string | null;
  status?: string;
  isDeleted?: boolean;
}

export interface IProductRepository {
  findById(query: { id: string; organizationId: string }): Promise<Product | null>;
  findByIds(query: { ids: string[]; organizationId: string }): Promise<Product[]>;
  findBySku(query: { sku: string; organizationId: string }): Promise<Product | null>;
  findByBarcode(query: { barcode: string; organizationId: string }): Promise<Product | null>;
  findByScan(query: { code: string; organizationId: string }): Promise<Product | null>;
  findLowStock(query: { organizationId: string; branchId?: string; limit?: number }): Promise<Product[]>;
  search(query: { organizationId: string; query: string; limit?: number }): Promise<Product[]>;
  save(product: Product): Promise<void>;
  list(query: ListProductsQuery): Promise<{ data: Product[]; total: number }>;
}

