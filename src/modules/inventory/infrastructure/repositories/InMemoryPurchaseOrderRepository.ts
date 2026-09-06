import { IPurchaseOrderRepository, ListPurchaseOrdersQuery } from '../../domain/ports/IPurchaseOrderRepository';
import { PurchaseOrder } from '../../domain/entities/PurchaseOrder';

export class InMemoryPurchaseOrderRepository implements IPurchaseOrderRepository {
  public orders: PurchaseOrder[] = [];

  async findById(query: { id: string; organizationId: string }): Promise<PurchaseOrder | null> {
    const o = this.orders.find(x => x.id === query.id && x.organizationId === query.organizationId);
    return o ? PurchaseOrder.reconstitute({ ...o.props, id: o.id }) : null;
  }

  async save(po: PurchaseOrder): Promise<void> {
    const idx = this.orders.findIndex(x => x.id === po.id);
    if (idx >= 0) {
      this.orders[idx] = PurchaseOrder.reconstitute({ ...po.props, id: po.id });
    } else {
      this.orders.push(PurchaseOrder.reconstitute({ ...po.props, id: po.id }));
    }
  }

  async list(query: ListPurchaseOrdersQuery): Promise<{ data: PurchaseOrder[]; total: number }> {
    let filtered = this.orders.filter(o => o.organizationId === query.organizationId);
    if (query.branchId) {
      filtered = filtered.filter(o => o.branchId === query.branchId);
    }
    if (query.supplierId) {
      filtered = filtered.filter(o => o.supplierId === query.supplierId);
    }
    if (query.status) {
      filtered = filtered.filter(o => o.status === query.status);
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const start = (page - 1) * limit;
    return {
      data: filtered.slice(start, start + limit).map(o => PurchaseOrder.reconstitute({ ...o.props, id: o.id })),
      total: filtered.length,
    };
  }
}
