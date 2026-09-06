import { IPaymentRepository, ListPaymentsQuery } from '../../domain/ports/IPaymentRepository';
import { Payment } from '../../domain/entities/Payment';
import { PaymentModel, IPaymentDoc } from '../persistence/payment.model';
import { PaymentMethod, PaymentType, AllocationStatus } from '../../domain/value-objects/AccountingEnums';

export class MongoPaymentRepository implements IPaymentRepository {
  async findById(query: { id: string; organizationId: string }): Promise<Payment | null> {
    const doc = await PaymentModel.findOne({ _id: query.id, organizationId: query.organizationId }).lean<IPaymentDoc>();
    if (!doc) return null;
    return this.mapToDomain(doc);
  }

  async findByCustomerId(query: { customerId: string; organizationId: string }): Promise<Payment[]> {
    const docs = await PaymentModel.find({
      customerId: query.customerId,
      organizationId: query.organizationId,
      isDeleted: false,
    })
      .sort({ paymentDate: -1 })
      .lean<IPaymentDoc[]>();

    return docs.map(d => this.mapToDomain(d));
  }

  async findByInvoiceId(query: { invoiceId: string; organizationId: string }): Promise<Payment[]> {
    const docs = await PaymentModel.find({
      organizationId: query.organizationId,
      isDeleted: false,
      $or: [
        { invoiceId: query.invoiceId },
        { 'allocatedTo.documentId': query.invoiceId },
      ],
    })
      .sort({ paymentDate: -1 })
      .lean<IPaymentDoc[]>();

    return docs.map(d => this.mapToDomain(d));
  }

  async save(payment: Payment): Promise<void> {
    await PaymentModel.updateOne(
      { _id: payment.id, organizationId: payment.organizationId },
      { $set: payment.props },
      { upsert: true }
    );
  }

  async list(query: ListPaymentsQuery): Promise<{ data: Payment[]; total: number }> {
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

    if (query.customerId) filter.customerId = query.customerId;
    if (query.supplierId) filter.supplierId = query.supplierId;
    if (query.invoiceId) filter.invoiceId = query.invoiceId;
    if (query.branchId) filter.branchId = query.branchId;
    if (query.type) filter.type = query.type;
    if (query.status) filter.status = query.status;

    const [docs, total] = await Promise.all([
      PaymentModel.find(filter).sort({ paymentDate: -1 }).skip(skip).limit(limit).lean<IPaymentDoc[]>(),
      PaymentModel.countDocuments(filter),
    ]);

    return {
      data: docs.map(d => this.mapToDomain(d)),
      total,
    };
  }

  private mapToDomain(doc: IPaymentDoc): Payment {
    return Payment.reconstitute({
      id: doc._id,
      organizationId: doc.organizationId,
      branchId: doc.branchId,
      type: doc.type as PaymentType,
      customerId: doc.customerId,
      supplierId: doc.supplierId,
      invoiceId: doc.invoiceId,
      purchaseId: doc.purchaseId,
      paymentDate: doc.paymentDate,
      referenceNumber: doc.referenceNumber,
      amount: doc.amount,
      remainingAmount: doc.remainingAmount ?? doc.amount,
      paymentMethod: doc.paymentMethod as PaymentMethod,
      transactionId: doc.transactionId,
      bankName: doc.bankName,
      remarks: doc.remarks,
      status: doc.status as 'pending' | 'completed' | 'failed' | 'cancelled',
      allocationStatus: doc.allocationStatus as AllocationStatus,
      allocatedTo: doc.allocatedTo ? doc.allocatedTo.map(a => ({
        type: a.type as 'invoice' | 'advance' | 'purchase' | 'other',
        documentId: a.documentId,
        amount: a.amount,
        allocatedAt: a.allocatedAt,
      })) : [],
      isDeleted: doc.isDeleted || false,
      createdBy: doc.createdBy,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }
}
