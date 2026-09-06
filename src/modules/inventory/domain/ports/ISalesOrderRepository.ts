import { SalesOrder } from '../entities/SalesOrder';

export interface ListSalesOrdersQuery {
  organizationId: string;
  branchId?: string;
  customerId?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface ISalesOrderRepository {
  findById(query: { id: string; organizationId: string }): Promise<SalesOrder | null>;
  save(so: SalesOrder): Promise<void>;
  list(query: ListSalesOrdersQuery): Promise<{ data: SalesOrder[]; total: number }>;
}

