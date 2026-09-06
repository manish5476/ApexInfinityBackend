import { IInvoiceRepository, ListInvoicesQuery } from '../../domain/ports/IInvoiceRepository';
import { Invoice } from '../../domain/entities/Invoice';
import { InvoiceModel, IInvoiceDoc } from '../persistence/invoice.model';
import { InvoiceStatus, PaymentMethod } from '../../domain/value-objects/AccountingEnums';

export class MongoInvoiceRepository implements IInvoiceRepository {
  async findById(query: { id: string; organizationId: string }): Promise<Invoice | null> {
    const doc = await InvoiceModel.findOne({ _id: query.id, organizationId: query.organizationId }).lean<IInvoiceDoc>();
    if (!doc) return null;
    return this.mapToDomain(doc);
  }

  async findByInvoiceNumber(query: { invoiceNumber: string; organizationId: string }): Promise<Invoice | null> {
    const doc = await InvoiceModel.findOne({
      invoiceNumber: query.invoiceNumber.toUpperCase().trim(),
      organizationId: query.organizationId,
    }).lean<IInvoiceDoc>();
    if (!doc) return null;
    return this.mapToDomain(doc);
  }

  async findByCustomerId(query: { customerId: string; organizationId: string; limit?: number }): Promise<Invoice[]> {
    const limit = query.limit || 50;
    const docs = await InvoiceModel.find({
      customerId: query.customerId,
      organizationId: query.organizationId,
      isDeleted: false,
    })
      .sort({ invoiceDate: -1 })
      .limit(limit)
      .lean<IInvoiceDoc[]>();

    return docs.map(d => this.mapToDomain(d));
  }

  async findOutstanding(query: { organizationId: string; customerId?: string }): Promise<Invoice[]> {
    const filter: Record<string, any> = {
      organizationId: query.organizationId,
      isDeleted: false,
      balanceAmount: { $gt: 0 },
      status: { $ne: 'cancelled' },
    };
    if (query.customerId) {
      filter.customerId = query.customerId;
    }

    const docs = await InvoiceModel.find(filter).sort({ dueDate: 1 }).lean<IInvoiceDoc[]>();
    return docs.map(d => this.mapToDomain(d));
  }

  async save(invoice: Invoice): Promise<void> {
    await InvoiceModel.updateOne(
      { _id: invoice.id, organizationId: invoice.organizationId },
      { $set: invoice.props },
      { upsert: true }
    );
  }

  async list(query: ListInvoicesQuery): Promise<{ data: Invoice[]; total: number }> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {
      organizationId: query.organizationId,
    };

    if (query.isDeleted !== undefined) {
      filter.isDeleted = query.isDeleted;
    } else {
      filter.isDeleted = false;
    }

    if (query.status) {
      filter.status = query.status;
    }

    if (query.paymentStatus) {
      filter.paymentStatus = query.paymentStatus;
    }

    if (query.customerId) {
      filter.customerId = query.customerId;
    }

    if (query.branchId) {
      filter.branchId = query.branchId;
    }

    if (query.search) {
      filter.invoiceNumber = new RegExp(query.search.trim(), 'i');
    }

    if (query.fromDate || query.toDate) {
      filter.invoiceDate = {};
      if (query.fromDate) filter.invoiceDate.$gte = query.fromDate;
      if (query.toDate) filter.invoiceDate.$lte = query.toDate;
    }

    const [docs, total] = await Promise.all([
      InvoiceModel.find(filter).sort({ invoiceDate: -1 }).skip(skip).limit(limit).lean<IInvoiceDoc[]>(),
      InvoiceModel.countDocuments(filter),
    ]);

    return {
      data: docs.map(d => this.mapToDomain(d)),
      total,
    };
  }

  private mapToDomain(doc: IInvoiceDoc): Invoice {
    return Invoice.reconstitute({
      id: doc._id,
      organizationId: doc.organizationId,
      branchId: doc.branchId,
      customerId: doc.customerId,
      invoiceNumber: doc.invoiceNumber,
      invoiceDate: doc.invoiceDate,
      dueDate: doc.dueDate,
      status: doc.status as InvoiceStatus,
      source: doc.source as 'crm' | 'storefront' | 'pos',
      items: doc.items.map(i => ({
        productId: i.productId,
        name: i.name,
        quantity: i.quantity,
        price: i.price,
        discount: i.discount,
        taxRate: i.taxRate,
        hsnCode: i.hsnCode,
      })),
      subTotal: doc.subTotal,
      totalTax: doc.totalTax,
      totalDiscount: doc.totalDiscount,
      shippingCharges: doc.shippingCharges,
      roundOff: doc.roundOff,
      grandTotal: doc.grandTotal,
      paymentStatus: doc.paymentStatus as 'unpaid' | 'partial' | 'paid',
      paidAmount: doc.paidAmount,
      balanceAmount: doc.balanceAmount,
      paymentMethod: doc.paymentMethod as PaymentMethod,
      notes: doc.notes,
      billingAddress: doc.billingAddress,
      shippingAddress: doc.shippingAddress,
      isDeleted: doc.isDeleted || false,
      createdBy: doc.createdBy,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }
}
