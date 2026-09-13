import { randomUUID } from 'crypto';
import { IEventBus } from '../../../../infrastructure/messaging/IEventBus';
import { StorefrontOrderModel } from '../../infrastructure/persistence';
import { CustomerModel } from '../../../crm/infrastructure/persistence';
import { InvoiceModel } from '../../../accounting/infrastructure/persistence';
import { SalesOrderModel } from '../../../inventory/infrastructure/persistence';

export class StorefrontCRMBridgeService {
  constructor(private readonly eventBus: IEventBus) {}

  public initialize(): void {
    this.eventBus.subscribe<{
      orderId: string;
      organizationId: string;
      orderNumber: string;
      grandTotal: number;
    }>('StorefrontOrderCreatedEvent', async (payload) => {
      await this.handleOrderCreated(payload);
    });
  }

  public async handleOrderCreated(payload: {
    orderId: string;
    organizationId: string;
    orderNumber: string;
    grandTotal: number;
  }): Promise<void> {
    try {
      const order = await StorefrontOrderModel.findOne({
        _id: payload.orderId,
        organizationId: payload.organizationId,
      });

      if (!order) return;

      // 1. Resolve or Create CRM Customer
      let customer = await CustomerModel.findOne({
        organizationId: order.organizationId,
        email: order.customerEmail.toLowerCase().trim(),
        isDeleted: false,
      });

      if (!customer) {
        const fullName = order.shippingAddress?.fullName || order.customerEmail.split('@')[0];
        customer = await CustomerModel.create({
          _id: randomUUID(),
          organizationId: order.organizationId,
          name: fullName,
          email: order.customerEmail.toLowerCase().trim(),
          phone: order.customerPhone || order.shippingAddress?.phone || null,
          type: 'individual',
          status: 'active',
          isActive: true,
          isDeleted: false,
          openingBalance: 0,
          outstandingBalance: 0,
          creditLimit: 0,
          tags: ['storefront'],
          shippingAddress: {
            street: order.shippingAddress?.addressLine1 || '',
            city: order.shippingAddress?.city || '',
            state: order.shippingAddress?.state || '',
            zipCode: order.shippingAddress?.postalCode || '',
            country: order.shippingAddress?.country || 'India',
          },
          billingAddress: {
            street: order.billingAddress?.addressLine1 || order.shippingAddress?.addressLine1 || '',
            city: order.billingAddress?.city || order.shippingAddress?.city || '',
            state: order.billingAddress?.state || order.shippingAddress?.state || '',
            zipCode: order.billingAddress?.postalCode || order.shippingAddress?.postalCode || '',
            country: order.billingAddress?.country || order.shippingAddress?.country || 'India',
          },
        });
      }

      // 2. Create CRM Invoice
      const invoiceNumber = `INV-${order.orderNumber}`;
      const existingInvoice = await InvoiceModel.findOne({
        organizationId: order.organizationId,
        invoiceNumber,
      });

      let invoice = existingInvoice;
      if (!invoice) {
        const invoiceItems = (order.items || []).map((it) => ({
          productId: it.productId,
          name: it.name,
          quantity: it.quantity,
          price: it.unitPrice,
          discount: 0,
          taxRate: it.snapshot?.taxRate || 0,
          hsnCode: it.snapshot?.hsnCode || null,
        }));

        invoice = await InvoiceModel.create({
          _id: randomUUID(),
          organizationId: order.organizationId,
          customerId: customer._id,
          invoiceNumber,
          invoiceDate: new Date(),
          status: 'issued',
          source: 'storefront',
          items: invoiceItems,
          subTotal: order.totals?.subtotal || order.totalAmount,
          totalTax: order.totals?.tax || 0,
          totalDiscount: order.totals?.discount || 0,
          shippingCharges: order.totals?.shipping || order.deliveryFee || 0,
          roundOff: 0,
          grandTotal: order.totals?.grandTotal || order.totalAmount,
          paymentStatus: order.paymentStatus === 'paid' ? 'paid' : 'unpaid',
          paidAmount: order.paymentStatus === 'paid' ? (order.totals?.grandTotal || order.totalAmount) : 0,
          balanceAmount: order.paymentStatus === 'paid' ? 0 : (order.totals?.grandTotal || order.totalAmount),
          paymentMethod: order.paymentMethod || 'COD',
          isDeleted: false,
        });
      }

      // 3. Create Sales Order
      const salesOrderItems = (order.items || []).map((it) => ({
        productId: it.productId,
        name: it.name,
        quantity: it.quantity,
        price: it.unitPrice,
        taxRate: it.snapshot?.taxRate || 0,
        discount: 0,
      }));

      const salesOrder = await SalesOrderModel.create({
        _id: randomUUID(),
        organizationId: order.organizationId,
        branchId: 'default',
        customerId: customer._id,
        invoiceId: invoice._id,
        status: 'confirmed',
        items: salesOrderItems,
        subTotal: order.totals?.subtotal || order.totalAmount,
        totalTax: order.totals?.tax || 0,
        totalDiscount: order.totals?.discount || 0,
        grandTotal: order.totals?.grandTotal || order.totalAmount,
        paymentStatus: order.paymentStatus === 'paid' ? 'paid' : 'unpaid',
        paidAmount: order.paymentStatus === 'paid' ? (order.totals?.grandTotal || order.totalAmount) : 0,
        balanceAmount: order.paymentStatus === 'paid' ? 0 : (order.totals?.grandTotal || order.totalAmount),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // 4. Update Storefront Order with CRM references
      order.crmCustomerId = customer._id;
      order.crmInvoiceId = invoice._id;
      order.crmSaleId = salesOrder._id;
      order.crmSyncStatus = 'synced';
      order.crmSyncedAt = new Date();
      order.crmSyncError = null;
      await order.save();
    } catch (err: any) {
      // Record failure on the storefront order for audit & retry
      await StorefrontOrderModel.updateOne(
        { _id: payload.orderId, organizationId: payload.organizationId },
        {
          $set: {
            crmSyncStatus: 'failed',
            crmSyncError: err?.message || 'Unknown CRM sync error',
          },
        }
      );
    }
  }
}
