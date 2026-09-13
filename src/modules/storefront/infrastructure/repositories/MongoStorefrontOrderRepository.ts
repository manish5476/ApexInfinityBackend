import { IStorefrontOrderRepository } from '../../domain/ports/IStorefrontOrderRepository';
import { StorefrontOrder, StorefrontOrderProps } from '../../domain/entities/StorefrontOrder';
import { StorefrontOrderModel, IStorefrontOrderDoc } from '../persistence/storefrontOrder.model';
import { StorefrontOrderStatus } from '../../domain/value-objects/StorefrontEnums';

export class MongoStorefrontOrderRepository implements IStorefrontOrderRepository {
  async findById(query: { id: string; organizationId: string }): Promise<StorefrontOrder | null> {
    const doc = await StorefrontOrderModel.findOne({
      _id: query.id,
      organizationId: query.organizationId,
    }).lean<IStorefrontOrderDoc>();

    if (!doc) return null;
    return this.mapToDomain(doc);
  }

  async findByOrderNumber(query: { orderNumber: string; organizationId: string }): Promise<StorefrontOrder | null> {
    const doc = await StorefrontOrderModel.findOne({
      orderNumber: query.orderNumber.toUpperCase().trim(),
      organizationId: query.organizationId,
    }).lean<IStorefrontOrderDoc>();

    if (!doc) return null;
    return this.mapToDomain(doc);
  }

  async save(order: StorefrontOrder): Promise<void> {
    const p = order.props;
    await StorefrontOrderModel.updateOne(
      { _id: order.id, organizationId: p.organizationId },
      {
        $set: {
          _id: order.id,
          organizationId: p.organizationId,
          orderNumber: p.orderNumber,
          customerId: p.customerId ?? null,
          customerEmail: p.customerEmail,
          customerPhone: p.customerPhone ?? null,
          items: p.items.map((it) => ({
            productId: it.productId,
            name: it.name,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            lineTotal: it.lineTotal,
          })),
          shippingAddress: {
            fullName: p.shippingAddress.fullName,
            phone: p.shippingAddress.phone,
            addressLine1: p.shippingAddress.street,
            city: p.shippingAddress.city,
            state: p.shippingAddress.state,
            postalCode: p.shippingAddress.postalCode,
            country: p.shippingAddress.country || 'India',
          },
          billingAddress: {
            fullName: p.shippingAddress.fullName,
            phone: p.shippingAddress.phone,
            addressLine1: p.shippingAddress.street,
            city: p.shippingAddress.city,
            state: p.shippingAddress.state,
            postalCode: p.shippingAddress.postalCode,
            country: p.shippingAddress.country || 'India',
          },
          totals: {
            subtotal: p.totals.subtotal,
            discount: p.totals.discount,
            shipping: p.totals.shipping,
            tax: p.totals.tax,
            grandTotal: p.totals.grandTotal,
          },
          totalAmount: p.totals.grandTotal,
          deliveryFee: p.totals.shipping,
          status: p.status,
          paymentStatus: p.paymentStatus === 'paid' ? 'paid' : 'pending',
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
        },
      },
      { upsert: true }
    );
  }

  async list(query: {
    organizationId: string;
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<{ data: StorefrontOrder[]; total: number }> {
    const filter: Record<string, any> = { organizationId: query.organizationId };
    if (query.status) {
      filter.status = query.status;
    }
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const [docs, total] = await Promise.all([
      StorefrontOrderModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean<IStorefrontOrderDoc[]>(),
      StorefrontOrderModel.countDocuments(filter),
    ]);

    return {
      data: docs.map((d) => this.mapToDomain(d)),
      total,
    };
  }

  private mapToDomain(doc: IStorefrontOrderDoc): StorefrontOrder {
    const props: StorefrontOrderProps & { id: string } = {
      id: doc._id,
      organizationId: doc.organizationId,
      orderNumber: doc.orderNumber,
      customerId: doc.customerId,
      customerEmail: doc.customerEmail,
      customerPhone: doc.customerPhone,
      items: (doc.items || []).map((it) => ({
        productId: it.productId,
        name: it.name || it.snapshot?.name || 'Product',
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        lineTotal: it.lineTotal,
      })),
      shippingAddress: {
        fullName: doc.shippingAddress?.fullName || '',
        phone: doc.shippingAddress?.phone || '',
        street: doc.shippingAddress?.addressLine1 || '',
        city: doc.shippingAddress?.city || '',
        state: doc.shippingAddress?.state || '',
        postalCode: doc.shippingAddress?.postalCode || '',
        country: doc.shippingAddress?.country || 'India',
      },
      totals: {
        subtotal: doc.totals?.subtotal || doc.totalAmount || 0,
        discount: doc.totals?.discount || 0,
        shipping: doc.totals?.shipping || doc.deliveryFee || 0,
        tax: doc.totals?.tax || 0,
        grandTotal: doc.totals?.grandTotal || doc.totalAmount || 0,
      },
      status: (doc.status as StorefrontOrderStatus) || StorefrontOrderStatus.PENDING,
      paymentStatus: doc.paymentStatus === 'paid' ? 'paid' : 'unpaid',
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };

    return StorefrontOrder.reconstitute(props);
  }
}
