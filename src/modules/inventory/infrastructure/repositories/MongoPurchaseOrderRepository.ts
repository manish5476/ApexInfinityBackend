import { IPurchaseOrderRepository, ListPurchaseOrdersQuery } from '../../domain/ports/IPurchaseOrderRepository';
import { PurchaseOrder } from '../../domain/entities/PurchaseOrder';
import { PurchaseOrderModel, IPurchaseOrderDoc } from '../persistence/purchaseOrder.model';
import { OrderStatus, PaymentStatus } from '../../domain/value-objects/InventoryEnums';

export class MongoPurchaseOrderRepository implements IPurchaseOrderRepository {
  async findById(query: { id: string; organizationId: string }): Promise<PurchaseOrder | null> {
    const doc = await PurchaseOrderModel.findOne({ _id: query.id, organizationId: query.organizationId }).lean<IPurchaseOrderDoc>();
    if (!doc) return null;
    return this.mapToDomain(doc);
  }

  async save(po: PurchaseOrder): Promise<void> {
    await PurchaseOrderModel.updateOne(
      { _id: po.id, organizationId: po.organizationId },
      { $set: po.props },
      { upsert: true }
    );
  }

  async list(query: ListPurchaseOrdersQuery): Promise<{ data: PurchaseOrder[]; total: number }> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {
      organizationId: query.organizationId,
    };

    if (query.branchId) {
      filter.branchId = query.branchId;
    }
    if (query.supplierId) {
      filter.supplierId = query.supplierId;
    }
    if (query.status) {
      filter.status = query.status;
    }

    const [docs, total] = await Promise.all([
      PurchaseOrderModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean<IPurchaseOrderDoc[]>(),
      PurchaseOrderModel.countDocuments(filter),
    ]);

    return {
      data: docs.map(d => this.mapToDomain(d)),
      total,
    };
  }

  private mapToDomain(doc: IPurchaseOrderDoc): PurchaseOrder {
    return PurchaseOrder.reconstitute({
      id: doc._id,
      organizationId: doc.organizationId,
      branchId: doc.branchId,
      supplierId: doc.supplierId,
      supplierName: doc.supplierName,
      invoiceNumber: doc.invoiceNumber,
      purchaseDate: doc.purchaseDate,
      dueDate: doc.dueDate,
      status: doc.status as OrderStatus,
      items: doc.items.map(item => ({
        productId: item.productId,
        name: item.name,
        quantity: item.quantity,
        purchasePrice: item.purchasePrice,
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
