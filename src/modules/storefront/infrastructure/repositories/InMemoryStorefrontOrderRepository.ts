import { IStorefrontOrderRepository } from '../../domain/ports/IStorefrontOrderRepository';
import { StorefrontOrder } from '../../domain/entities/StorefrontOrder';

export class InMemoryStorefrontOrderRepository implements IStorefrontOrderRepository {
  public orders: StorefrontOrder[] = [];

  async findById(query: { id: string; organizationId: string }): Promise<StorefrontOrder | null> {
    const o = this.orders.find((x) => x.id === query.id && x.organizationId === query.organizationId);
    return o ? StorefrontOrder.reconstitute({ ...o.props, id: o.id }) : null;
  }

  async findByOrderNumber(query: { orderNumber: string; organizationId: string }): Promise<StorefrontOrder | null> {
    const o = this.orders.find((x) => x.orderNumber === query.orderNumber.toUpperCase() && x.organizationId === query.organizationId);
    return o ? StorefrontOrder.reconstitute({ ...o.props, id: o.id }) : null;
  }

  async save(order: StorefrontOrder): Promise<void> {
    const idx = this.orders.findIndex((x) => x.id === order.id);
    if (idx >= 0) {
      this.orders[idx] = StorefrontOrder.reconstitute({ ...order.props, id: order.id });
    } else {
      this.orders.push(StorefrontOrder.reconstitute({ ...order.props, id: order.id }));
    }
  }

  async list(query: { organizationId: string; page?: number; limit?: number; status?: string }): Promise<{ data: StorefrontOrder[]; total: number }> {
    let filtered = this.orders.filter((x) => x.organizationId === query.organizationId);
    if (query.status) {
      filtered = filtered.filter((x) => x.status === query.status);
    }
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const start = (page - 1) * limit;

    return {
      data: filtered.slice(start, start + limit).map((x) => StorefrontOrder.reconstitute({ ...x.props, id: x.id })),
      total: filtered.length,
    };
  }
}
