import { Request, Response, NextFunction } from 'express';
import { RequestContextHolder } from '../../../../middleware/requestContext.middleware';
import { InvoiceModel } from '../../../accounting/infrastructure/persistence';
import { CustomerModel } from '../../../crm/infrastructure/persistence';
import { ProductModel, SalesOrderModel } from '../../../inventory/infrastructure/persistence';

export class DashboardController {
  public getDashboardOverview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = RequestContextHolder.get();
      const orgId = context?.organizationId;

      const [customerCount, productCount, salesStats, recentOrders] = await Promise.all([
        CustomerModel.countDocuments({ organizationId: orgId, isDeleted: false }),
        ProductModel.countDocuments({ organizationId: orgId, isDeleted: false }),
        InvoiceModel.aggregate([
          { $match: { organizationId: orgId, status: { $nin: ['draft', 'cancelled'] } } },
          {
            $group: {
              _id: null,
              totalRevenue: { $sum: '$grandTotal' },
              totalInvoices: { $sum: 1 },
            },
          },
        ]),
        SalesOrderModel.find({ organizationId: orgId })
          .sort({ createdAt: -1 })
          .limit(5)
          .lean()
          .catch(() => []),
      ]);

      const stats = salesStats[0] || { totalRevenue: 0, totalInvoices: 0 };

      res.status(200).json({
        status: 'success',
        message: 'Dashboard data fetched successfully',
        data: {
          metrics: {
            totalRevenue: stats.totalRevenue,
            totalInvoices: stats.totalInvoices,
            totalCustomers: customerCount,
            totalProducts: productCount,
          },
          recentOrders,
        },
      });
    } catch (err) {
      next(err);
    }
  };
}
