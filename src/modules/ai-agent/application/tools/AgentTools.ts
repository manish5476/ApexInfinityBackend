import mongoose from 'mongoose';
import { InvoiceModel } from '../../../accounting/infrastructure/persistence';
import { ProductModel } from '../../../inventory/infrastructure/persistence';
import { CustomerModel } from '../../../crm/infrastructure/persistence';
import { StorefrontOrderModel } from '../../../storefront/infrastructure/persistence';
import { AiToolResult } from '../../domain/entities/AiAgent';

function toObjectId(id: string): mongoose.Types.ObjectId | string {
  return mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id;
}

export class AgentTools {
  /**
   * Tool: Calculates real financial metrics & revenue from MongoDB Invoices
   */
  static async salesAnalyticsTool(orgId: string, branchId?: string): Promise<AiToolResult> {
    const match: Record<string, unknown> = {
      organizationId: orgId,
      status: { $nin: ['draft', 'cancelled'] },
    };
    if (branchId) {
      match.branchId = branchId;
    }

    const [stats] = await InvoiceModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$grandTotal' },
          totalPaid: { $sum: '$amountPaid' },
          totalOutstanding: { $sum: '$balanceDue' },
          invoiceCount: { $sum: 1 },
        },
      },
    ]);

    const totalRevenue = stats?.totalRevenue ?? 0;
    const totalPaid = stats?.totalPaid ?? 0;
    const totalOutstanding = stats?.totalOutstanding ?? 0;
    const invoiceCount = stats?.invoiceCount ?? 0;

    return {
      toolName: 'SalesAnalyticsTool',
      success: true,
      data: { totalRevenue, totalPaid, totalOutstanding, invoiceCount },
      summary: `Total Revenue is ₹${totalRevenue.toLocaleString('en-IN')} across ${invoiceCount} invoices (Paid: ₹${totalPaid.toLocaleString('en-IN')}, Outstanding: ₹${totalOutstanding.toLocaleString('en-IN')}).`,
    };
  }

  /**
   * Tool: Inspects live stock levels and inventory valuation from MongoDB Products
   */
  static async inventoryStockTool(orgId: string, searchTerm?: string): Promise<AiToolResult> {
    const filter: Record<string, unknown> = {
      organizationId: orgId,
      isDeleted: false,
    };

    if (searchTerm && searchTerm.trim().length > 0) {
      const regex = new RegExp(searchTerm.trim(), 'i');
      filter.$or = [{ name: regex }, { sku: regex }];
    }

    const products = await ProductModel.find(filter)
      .select('_id name sku sellingPrice purchasePrice inventory')
      .limit(20)
      .lean();

    const totalCount = await ProductModel.countDocuments({ organizationId: orgId, isDeleted: false });

    let totalValuation = 0;
    let lowStockCount = 0;

    for (const p of products) {
      const items = (p as any).inventory || [];
      const stock = items.reduce((sum: number, i: any) => sum + (i.quantity || 0), 0);
      const cost = (p as any).purchasePrice || 0;
      totalValuation += stock * cost;
      if (stock <= 5) {
        lowStockCount++;
      }
    }

    const matchedProducts = products.map((p: any) => ({
      id: p._id.toString(),
      name: p.name,
      sku: p.sku,
      price: p.sellingPrice,
      stock: (p.inventory || []).reduce((sum: number, i: any) => sum + (i.quantity || 0), 0),
    }));

    return {
      toolName: 'InventoryStockTool',
      success: true,
      data: {
        totalProducts: totalCount,
        matchedCount: matchedProducts.length,
        estimatedValuation: totalValuation,
        lowStockCount,
        products: matchedProducts,
      },
      summary: matchedProducts.length > 0
        ? `Found ${matchedProducts.length} product(s). Low stock items: ${lowStockCount}. Estimated valuation: ₹${totalValuation.toLocaleString('en-IN')}.`
        : `No products matching "${searchTerm || ''}". Total products in catalog: ${totalCount}.`,
    };
  }

  /**
   * Tool: Queries customers with outstanding dues from MongoDB Customers
   */
  static async customerDuesTool(orgId: string, minAmount = 0): Promise<AiToolResult> {
    const customers = await CustomerModel.find({
      organizationId: orgId,
      isDeleted: false,
      outstandingBalance: { $gt: minAmount },
    })
      .sort({ outstandingBalance: -1 })
      .limit(10)
      .select('_id name phone email outstandingBalance creditLimit')
      .lean();

    const totalDues = customers.reduce((sum, c: any) => sum + (c.outstandingBalance || 0), 0);

    return {
      toolName: 'CustomerDuesTool',
      success: true,
      data: {
        count: customers.length,
        totalDues,
        customers: customers.map((c: any) => ({
          id: c._id.toString(),
          name: c.name,
          phone: c.phone,
          outstandingBalance: c.outstandingBalance,
          creditLimit: c.creditLimit,
        })),
      },
      summary: customers.length > 0
        ? `${customers.length} customer(s) have outstanding balances exceeding ₹${minAmount.toLocaleString('en-IN')}, totaling ₹${totalDues.toLocaleString('en-IN')}. Top debtor: ${customers[0]?.name} (₹${customers[0]?.outstandingBalance?.toLocaleString('en-IN')}).`
        : `No customers have outstanding balances exceeding ₹${minAmount.toLocaleString('en-IN')}.`,
    };
  }

  /**
   * Tool: Searches orders and fulfillment status from MongoDB Storefront Orders
   */
  static async orderLookupTool(orgId: string, query: string): Promise<AiToolResult> {
    const trimmed = query.trim();
    const order = await StorefrontOrderModel.findOne({
      organizationId: orgId,
      $or: [{ _id: trimmed }, { orderNumber: trimmed }, { customerEmail: trimmed }],
    }).lean();

    if (!order) {
      return {
        toolName: 'OrderLookupTool',
        success: false,
        data: {},
        summary: `No storefront order found matching identifier "${trimmed}".`,
      };
    }

    const orderData = {
      id: (order as any)._id,
      orderNumber: (order as any).orderNumber,
      status: (order as any).status,
      fulfillmentStatus: (order as any).fulfillmentStatus,
      paymentStatus: (order as any).paymentStatus,
      totalAmount: (order as any).totalAmount || (order as any).totals?.grandTotal || 0,
      createdAt: (order as any).createdAt,
    };

    return {
      toolName: 'OrderLookupTool',
      success: true,
      data: orderData,
      summary: `Order #${orderData.orderNumber} is currently "${orderData.status}" (Payment: ${orderData.paymentStatus}, Fulfillment: ${orderData.fulfillmentStatus}) for ₹${orderData.totalAmount.toLocaleString('en-IN')}.`,
    };
  }
}
