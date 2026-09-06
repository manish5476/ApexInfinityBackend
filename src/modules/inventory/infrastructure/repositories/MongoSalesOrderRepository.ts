import { ISalesOrderRepository, ListSalesOrdersQuery } from '../../domain/ports/ISalesOrderRepository';
import { SalesOrder } from '../../domain/entities/SalesOrder';
import { SalesOrderModel, ISalesOrderDoc } from '../persistence/salesOrder.model';
import { OrderStatus, PaymentStatus } from '../../domain/value-objects/InventoryEnums';

export class MongoSalesOrderRepository implements ISalesOrderRepository {
  async findById(query: { id: string; organizationId: string }): Promise<SalesOrder | null> {
    const doc = await SalesOrderModel.findOne({ _id: query.id, organizationId: query.organizationId }).lean<ISalesOrderDoc>();
    if (!doc) return null;
    return this.mapToDomain(doc);
  }

  async save(so: SalesOrder): Promise<void> {
    await SalesOrderModel.updateOne(
      { _id: so.id, organizationId: so.organizationId },
      { $set: so.props },
      { upsert: true }
    );
  }

  async list(query: ListSalesOrdersQuery): Promise<{ data: SalesOrder[]; total: number }> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {
      organizationId: query.organizationId,
    };

    if (query.branchId) {
      filter.branchId = query.branchId;
    }
    if (query.customerId) {
      filter.customerId = query.customerId;
    }
    if (query.status) {
      filter.status = query.status;
    }

    const [docs, total] = await Promise.all([
      SalesOrderModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean<ISalesOrderDoc[]>(),
      SalesOrderModel.countDocuments(filter),
    ]);

    return {
      data: docs.map(d => this.mapToDomain(d)),
      total,
    };
  }

  private mapToDomain(doc: ISalesOrderDoc): SalesOrder {
    return SalesOrder.reconstitute({
      id: doc._id,
      organizationId: doc.organizationId,
      branchId: doc.branchId,
      customerId: doc.customerId,
      invoiceId: doc.invoiceId,
      status: doc.status as OrderStatus,
      items: doc.items.map(item => ({
        productId: item.productId,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        taxRate: item.taxRate,
        discount: item.discount,
      })),
      subTotal: doc.subTotal,
      totalTax: doc.totalTax,
      totalDiscount: doc.totalDiscount,
      grandTotal: doc.grandTotal,
      paymentStatus: doc.paymentStatus as PaymentStatus,
      paidAmount: doc.paidAmount,
      balanceAmount: doc.balanceAmount,
      notes: doc.notes,
      createdBy: doc.createdBy,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }
}
