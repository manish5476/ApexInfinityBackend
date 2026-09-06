import { PurchaseOrder } from '../entities/PurchaseOrder';

export interface ListPurchaseOrdersQuery {
  organizationId: string;
  branchId?: string;
  supplierId?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface IPurchaseOrderRepository {
  findById(query: { id: string; organizationId: string }): Promise<PurchaseOrder | null>;
  save(po: PurchaseOrder): Promise<void>;
  list(query: ListPurchaseOrdersQuery): Promise<{ data: PurchaseOrder[]; total: number }>;
}

