import { StorefrontOrder } from '../entities/StorefrontOrder';

export interface IStorefrontOrderRepository {
  findById(query: { id: string; organizationId: string }): Promise<StorefrontOrder | null>;
  findByOrderNumber(query: { orderNumber: string; organizationId: string }): Promise<StorefrontOrder | null>;
  save(order: StorefrontOrder): Promise<void>;
  list(query: {
    organizationId: string;
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<{ data: StorefrontOrder[]; total: number }>;
}
