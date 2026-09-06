import { ISalesOrderRepository, ListSalesOrdersQuery } from '../../domain/ports/ISalesOrderRepository';
import { SalesOrder } from '../../domain/entities/SalesOrder';

export class InMemorySalesOrderRepository implements ISalesOrderRepository {
  public orders: SalesOrder[] = [];

  async findById(query: { id: string; organizationId: string }): Promise<SalesOrder | null> {
    const o = this.orders.find(x => x.id === query.id && x.organizationId === query.organizationId);
    return o ? SalesOrder.reconstitute({ ...o.props, id: o.id }) : null;
  }

  async save(so: SalesOrder): Promise<void> {
    const idx = this.orders.findIndex(x => x.id === so.id);
    if (idx >= 0) {
      this.orders[idx] = SalesOrder.reconstitute({ ...so.props, id: so.id });
    } else {
      this.orders.push(SalesOrder.reconstitute({ ...so.props, id: so.id }));
    }
  }

  async list(query: ListSalesOrdersQuery): Promise<{ data: SalesOrder[]; total: number }> {
    let filtered = this.orders.filter(o => o.organizationId === query.organizationId);
    if (query.branchId) {
      filtered = filtered.filter(o => o.branchId === query.branchId);
    }
    if (query.customerId) {
      filtered = filtered.filter(o => o.props.customerId === query.customerId);
    }
    if (query.status) {
      filtered = filtered.filter(o => o.status === query.status);
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const start = (page - 1) * limit;
    return {
      data: filtered.slice(start, start + limit).map(o => SalesOrder.reconstitute({ ...o.props, id: o.id })),
      total: filtered.length,
    };
  }
}
