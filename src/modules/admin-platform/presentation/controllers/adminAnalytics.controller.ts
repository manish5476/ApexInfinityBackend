import { Request, Response, NextFunction } from 'express';
import { RequestContextHolder } from '../../../../middleware/requestContext.middleware';
import { InvoiceModel } from '../../../accounting/infrastructure/persistence';
import { CustomerModel } from '../../../crm/infrastructure/persistence';
import { ProductModel, PurchaseOrderModel } from '../../../inventory/infrastructure/persistence';

export class AdminAnalyticsController {
  public summary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = RequestContextHolder.get();
      const orgId = context?.organizationId;
      const { startDate, endDate, branchId } = req.query;

      const match: any = { organizationId: orgId, status: { $nin: ['draft', 'cancelled'] } };
      if (branchId) match.branchId = branchId;
      if (startDate || endDate) {
        match.invoiceDate = {};
        if (startDate) match.invoiceDate.$gte = new Date(startDate as string);
        if (endDate) match.invoiceDate.$lte = new Date(endDate as string);
      }

      const [invoiceStats, customerCount] = await Promise.all([
        InvoiceModel.aggregate([
          { $match: match },
          {
            $group: {
              _id: null,
              totalRevenue: { $sum: '$grandTotal' },
              totalInvoices: { $sum: 1 },
              totalOutstanding: {
                $sum: {
                  $max: [{ $subtract: ['$grandTotal', { $ifNull: ['$paidAmount', 0] }] }, 0],
                },
              },
            },
          },
        ]),
        CustomerModel.countDocuments({ organizationId: orgId, isDeleted: false }),
      ]);

      const stats = invoiceStats[0] || { totalRevenue: 0, totalInvoices: 0, totalOutstanding: 0 };

      res.status(200).json({
        status: 'success',
        data: {
          totalRevenue: stats.totalRevenue,
          totalInvoices: stats.totalInvoices,
          totalOutstanding: stats.totalOutstanding,
          activeCustomers: customerCount,
        },
      });
    } catch (err) {
      next(err);
    }
  };

  public monthlyTrends = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = RequestContextHolder.get();
      const orgId = context?.organizationId;
      const months = Math.min(Math.max(Number(req.query.months) || 12, 1), 36);

      const cutoffDate = new Date();
      cutoffDate.setMonth(cutoffDate.getMonth() - months);

      const match: any = {
        organizationId: orgId,
        status: { $nin: ['draft', 'cancelled'] },
        invoiceDate: { $gte: cutoffDate },
      };
      if (req.query.branchId) match.branchId = req.query.branchId;

      const trends = await InvoiceModel.aggregate([
        { $match: match },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$invoiceDate' } },
            revenue: { $sum: '$grandTotal' },
            invoices: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        {
          $project: {
            month: '$_id',
            revenue: 1,
            invoices: 1,
            _id: 0,
          },
        },
      ]);

      res.status(200).json({ status: 'success', data: { trends } });
    } catch (err) {
      next(err);
    }
  };

  public outstanding = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = RequestContextHolder.get();
      const orgId = context?.organizationId;
      const type = (req.query.type as string || 'receivable').toLowerCase();
      const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);

      if (type === 'payable') {
        const payables = await PurchaseOrderModel.find({
          organizationId: orgId,
          status: { $nin: ['cancelled', 'draft'] },
          paymentStatus: { $ne: 'paid' },
        })
          .sort({ orderDate: -1 })
          .limit(limit)
          .lean();

        res.status(200).json({
          status: 'success',
          data: {
            type: 'payable',
            items: payables,
          },
        });
        return;
      }

      const receivables = await InvoiceModel.find({
        organizationId: orgId,
        status: { $nin: ['draft', 'cancelled'] },
        paymentStatus: { $ne: 'paid' },
      })
        .sort({ invoiceDate: -1 })
        .limit(limit)
        .lean();

      res.status(200).json({
        status: 'success',
        data: {
          type: 'receivable',
          items: receivables,
        },
      });
    } catch (err) {
      next(err);
    }
  };

  public topCustomers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = RequestContextHolder.get();
      const orgId = context?.organizationId;
      const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50);
      const { start, end } = req.query;

      const match: any = { organizationId: orgId, status: { $nin: ['draft', 'cancelled'] } };
      if (start || end) {
        match.invoiceDate = {};
        if (start) match.invoiceDate.$gte = new Date(start as string);
        if (end) match.invoiceDate.$lte = new Date(end as string);
      }

      const top = await InvoiceModel.aggregate([
        { $match: match },
        {
          $group: {
            _id: '$customerId',
            totalRevenue: { $sum: '$grandTotal' },
            invoiceCount: { $sum: 1 },
          },
        },
        { $sort: { totalRevenue: -1 } },
        { $limit: limit },
        {
          $lookup: {
            from: 'crmcustomers',
            localField: '_id',
            foreignField: '_id',
            as: 'customer',
          },
        },
        { $unwind: { path: '$customer', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            customerId: '$_id',
            name: { $ifNull: ['$customer.name', 'Unknown Customer'] },
            email: '$customer.email',
            phone: '$customer.phone',
            totalRevenue: 1,
            invoiceCount: 1,
            _id: 0,
          },
        },
      ]);

      res.status(200).json({ status: 'success', data: { topCustomers: top } });
    } catch (err) {
      next(err);
    }
  };

  public topProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = RequestContextHolder.get();
      const orgId = context?.organizationId;
      const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50);
      const { start, end } = req.query;

      const match: any = { organizationId: orgId, status: { $nin: ['draft', 'cancelled'] } };
      if (start || end) {
        match.invoiceDate = {};
        if (start) match.invoiceDate.$gte = new Date(start as string);
        if (end) match.invoiceDate.$lte = new Date(end as string);
      }

      const top = await InvoiceModel.aggregate([
        { $match: match },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.productId',
            soldQty: { $sum: '$items.quantity' },
            revenue: { $sum: { $multiply: ['$items.quantity', '$items.unitPrice'] } },
          },
        },
        { $sort: { soldQty: -1 } },
        { $limit: limit },
        {
          $lookup: {
            from: 'products',
            localField: '_id',
            foreignField: '_id',
            as: 'product',
          },
        },
        { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            productId: '$_id',
            name: { $ifNull: ['$product.name', 'Unknown Product'] },
            sku: '$product.sku',
            soldQty: 1,
            revenue: 1,
            _id: 0,
          },
        },
      ]);

      res.status(200).json({ status: 'success', data: { topProducts: top } });
    } catch (err) {
      next(err);
    }
  };

  public branchSales = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = RequestContextHolder.get();
      const orgId = context?.organizationId;
      const { start, end } = req.query;

      const match: any = { organizationId: orgId, status: { $nin: ['draft', 'cancelled'] } };
      if (start || end) {
        match.invoiceDate = {};
        if (start) match.invoiceDate.$gte = new Date(start as string);
        if (end) match.invoiceDate.$lte = new Date(end as string);
      }

      const branchSales = await InvoiceModel.aggregate([
        { $match: match },
        {
          $group: {
            _id: '$branchId',
            totalSales: { $sum: '$grandTotal' },
            invoices: { $sum: 1 },
          },
        },
        {
          $lookup: {
            from: 'branches',
            localField: '_id',
            foreignField: '_id',
            as: 'branch',
          },
        },
        { $unwind: { path: '$branch', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            branchId: '$_id',
            branchName: { $ifNull: ['$branch.name', 'Main Branch'] },
            totalSales: 1,
            invoices: 1,
            _id: 0,
          },
        },
        { $sort: { totalSales: -1 } },
      ]);

      res.status(200).json({ status: 'success', data: { branchSales } });
    } catch (err) {
      next(err);
    }
  };
}
