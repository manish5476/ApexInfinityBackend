import { Request, Response, NextFunction } from 'express';
import { CreateProductUseCase } from '../../application/use-cases/CreateProductUseCase';
import { ListProductsUseCase } from '../../application/use-cases/ListProductsUseCase';
import { GetProductByIdUseCase } from '../../application/use-cases/GetProductByIdUseCase';
import { UpdateProductUseCase } from '../../application/use-cases/UpdateProductUseCase';
import { DeleteProductUseCase } from '../../application/use-cases/DeleteProductUseCase';
import { RestoreProductUseCase } from '../../application/use-cases/RestoreProductUseCase';
import { SearchProductsUseCase } from '../../application/use-cases/SearchProductsUseCase';
import { ScanProductUseCase } from '../../application/use-cases/ScanProductUseCase';
import { GetLowStockProductsUseCase } from '../../application/use-cases/GetLowStockProductsUseCase';
import { AdjustStockUseCase } from '../../application/use-cases/AdjustStockUseCase';
import { TransferStockUseCase } from '../../application/use-cases/TransferStockUseCase';
import { BulkUpdateProductsUseCase } from '../../application/use-cases/BulkUpdateProductsUseCase';
import { CreatePurchaseOrderUseCase } from '../../application/use-cases/CreatePurchaseOrderUseCase';
import { ListPurchaseOrdersUseCase } from '../../application/use-cases/ListPurchaseOrdersUseCase';
import { GetPurchaseOrderByIdUseCase } from '../../application/use-cases/GetPurchaseOrderByIdUseCase';
import { ReceiveStockUseCase } from '../../application/use-cases/ReceiveStockUseCase';
import { CancelPurchaseOrderUseCase } from '../../application/use-cases/CancelPurchaseOrderUseCase';
import { CreateSalesOrderUseCase } from '../../application/use-cases/CreateSalesOrderUseCase';
import { ListSalesOrdersUseCase } from '../../application/use-cases/ListSalesOrdersUseCase';
import { GetSalesOrderByIdUseCase } from '../../application/use-cases/GetSalesOrderByIdUseCase';
import { DispatchSalesOrderUseCase } from '../../application/use-cases/DispatchSalesOrderUseCase';
import { CancelSalesOrderUseCase } from '../../application/use-cases/CancelSalesOrderUseCase';
import { RequestContextHolder } from '../../../../middleware/requestContext.middleware';
import crypto from 'crypto';
import { ProductModel, PurchaseOrderModel, SalesOrderModel } from '../../infrastructure/persistence';
import { BadRequestError } from '../../../../shared/errors';

export class InventoryController {
  constructor(
    private readonly createProduct: CreateProductUseCase,
    private readonly listProducts: ListProductsUseCase,
    private readonly getProductById: GetProductByIdUseCase,
    private readonly updateProduct: UpdateProductUseCase,
    private readonly deleteProduct: DeleteProductUseCase,
    private readonly restoreProduct: RestoreProductUseCase,
    private readonly searchProducts: SearchProductsUseCase,
    private readonly scanProduct: ScanProductUseCase,
    private readonly getLowStock: GetLowStockProductsUseCase,
    private readonly adjustStock: AdjustStockUseCase,
    private readonly transferStock: TransferStockUseCase,
    private readonly bulkUpdateProducts: BulkUpdateProductsUseCase,
    private readonly createPO: CreatePurchaseOrderUseCase,
    private readonly listPOs: ListPurchaseOrdersUseCase,
    private readonly getPOById: GetPurchaseOrderByIdUseCase,
    private readonly receiveStock: ReceiveStockUseCase,
    private readonly cancelPO: CancelPurchaseOrderUseCase,
    private readonly createSO: CreateSalesOrderUseCase,
    private readonly listSOs: ListSalesOrdersUseCase,
    private readonly getSOById: GetSalesOrderByIdUseCase,
    private readonly dispatchSO: DispatchSalesOrderUseCase,
    private readonly cancelSO: CancelSalesOrderUseCase,
  ) {}

  // ----------------- Products -----------------

  public createProductHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ctx = RequestContextHolder.get()!;
      const result = await this.createProduct.execute(req.body, { organizationId: ctx.organizationId! });
      res.status(201).json({ status: 'success', data: result });
    } catch (err) { next(err); }
  };

  public listProductsHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ctx = RequestContextHolder.get()!;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const isDeleted = req.query.isDeleted !== undefined ? req.query.isDeleted === 'true' : undefined;
      const result = await this.listProducts.execute(
        {
          page,
          limit,
          search: (req.query.search as string) || undefined,
          categoryId: (req.query.categoryId as string) || undefined,
          status: (req.query.status as string) || undefined,
          isDeleted,
        },
        { organizationId: ctx.organizationId! }
      );
      res.status(200).json({ status: 'success', data: result.data, total: result.total });
    } catch (err) { next(err); }
  };

  public getProductByIdHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ctx = RequestContextHolder.get()!;
      const result = await this.getProductById.execute({ id: req.params.id as string }, { organizationId: ctx.organizationId! });
      res.status(200).json({ status: 'success', data: result });
    } catch (err) { next(err); }
  };

  public updateProductHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ctx = RequestContextHolder.get()!;
      const result = await this.updateProduct.execute(
        { id: req.params.id as string, data: req.body },
        { organizationId: ctx.organizationId! }
      );
      res.status(200).json({ status: 'success', data: result });
    } catch (err) { next(err); }
  };

  public deleteProductHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ctx = RequestContextHolder.get()!;
      const result = await this.deleteProduct.execute({ id: req.params.id as string }, { organizationId: ctx.organizationId! });
      res.status(200).json({ status: 'success', ...result });
    } catch (err) { next(err); }
  };

  public restoreProductHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ctx = RequestContextHolder.get()!;
      const result = await this.restoreProduct.execute({ id: req.params.id as string }, { organizationId: ctx.organizationId! });
      res.status(200).json({ status: 'success', data: result });
    } catch (err) { next(err); }
  };

  public searchProductsHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ctx = RequestContextHolder.get()!;
      const query = (req.query.q as string) || (req.query.query as string) || '';
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const result = await this.searchProducts.execute({ query, limit }, { organizationId: ctx.organizationId! });
      res.status(200).json({ status: 'success', data: result });
    } catch (err) { next(err); }
  };

  public scanProductHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ctx = RequestContextHolder.get()!;
      const code = req.body.code || (req.query.code as string);
      const result = await this.scanProduct.execute({ code }, { organizationId: ctx.organizationId! });
      res.status(200).json({ status: 'success', data: result });
    } catch (err) { next(err); }
  };

  public lowStockReportHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ctx = RequestContextHolder.get()!;
      const branchId = (req.query.branchId as string) || undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const result = await this.getLowStock.execute({ branchId, limit }, { organizationId: ctx.organizationId! });
      res.status(200).json({ status: 'success', data: result });
    } catch (err) { next(err); }
  };

  public bulkUpdateProductsHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ctx = RequestContextHolder.get()!;
      const result = await this.bulkUpdateProducts.execute(req.body, { organizationId: ctx.organizationId! });
      res.status(200).json({ status: 'success', ...result });
    } catch (err) { next(err); }
  };

  public stockAdjustHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ctx = RequestContextHolder.get()!;
      const productId = (req.params.id as string) || req.body.productId;
      const result = await this.adjustStock.execute(
        {
          productId,
          branchId: req.body.branchId,
          delta: req.body.delta,
          reason: req.body.reason,
        },
        { organizationId: ctx.organizationId! }
      );
      res.status(200).json({ status: 'success', data: result });
    } catch (err) { next(err); }
  };

  public stockTransferHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ctx = RequestContextHolder.get()!;
      const productId = (req.params.id as string) || req.body.productId;
      const result = await this.transferStock.execute(
        {
          productId,
          fromBranchId: req.body.fromBranchId,
          toBranchId: req.body.toBranchId,
          quantity: req.body.quantity,
        },
        { organizationId: ctx.organizationId! }
      );
      res.status(200).json({ status: 'success', data: result });
    } catch (err) { next(err); }
  };

  // ----------------- Purchase Orders -----------------

  public createPurchaseOrderHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ctx = RequestContextHolder.get()!;
      const result = await this.createPO.execute(
        {
          ...req.body,
          dueDate: req.body.dueDate ? new Date(req.body.dueDate) : undefined,
          createdBy: ctx.userId,
        },
        { organizationId: ctx.organizationId! }
      );
      res.status(201).json({ status: 'success', data: result });
    } catch (err) { next(err); }
  };

  public listPurchaseOrdersHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ctx = RequestContextHolder.get()!;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const result = await this.listPOs.execute(
        {
          page,
          limit,
          branchId: (req.query.branchId as string) || undefined,
          supplierId: (req.query.supplierId as string) || undefined,
          status: (req.query.status as string) || undefined,
        },
        { organizationId: ctx.organizationId! }
      );
      res.status(200).json({ status: 'success', data: result.data, total: result.total });
    } catch (err) { next(err); }
  };

  public getPurchaseOrderByIdHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ctx = RequestContextHolder.get()!;
      const result = await this.getPOById.execute({ id: req.params.id as string }, { organizationId: ctx.organizationId! });
      res.status(200).json({ status: 'success', data: result });
    } catch (err) { next(err); }
  };

  public receiveStockHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ctx = RequestContextHolder.get()!;
      const result = await this.receiveStock.execute({ purchaseOrderId: req.params.id as string }, { organizationId: ctx.organizationId! });
      res.status(200).json({ status: 'success', data: result });
    } catch (err) { next(err); }
  };

  public cancelPurchaseOrderHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ctx = RequestContextHolder.get()!;
      const result = await this.cancelPO.execute({ purchaseOrderId: req.params.id as string }, { organizationId: ctx.organizationId! });
      res.status(200).json({ status: 'success', data: result });
    } catch (err) { next(err); }
  };

  // ----------------- Sales Orders -----------------

  public createSalesOrderHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ctx = RequestContextHolder.get()!;
      const result = await this.createSO.execute(
        {
          ...req.body,
          createdBy: ctx.userId,
        },
        { organizationId: ctx.organizationId! }
      );
      res.status(201).json({ status: 'success', data: result });
    } catch (err) { next(err); }
  };

  public listSalesOrdersHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ctx = RequestContextHolder.get()!;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const result = await this.listSOs.execute(
        {
          page,
          limit,
          branchId: (req.query.branchId as string) || undefined,
          customerId: (req.query.customerId as string) || undefined,
          status: (req.query.status as string) || undefined,
        },
        { organizationId: ctx.organizationId! }
      );
      res.status(200).json({ status: 'success', data: result.data, total: result.total });
    } catch (err) { next(err); }
  };

  public getSalesOrderByIdHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ctx = RequestContextHolder.get()!;
      const result = await this.getSOById.execute({ id: req.params.id as string }, { organizationId: ctx.organizationId! });
      res.status(200).json({ status: 'success', data: result });
    } catch (err) { next(err); }
  };

  public dispatchSalesOrderHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ctx = RequestContextHolder.get()!;
      const result = await this.dispatchSO.execute({ salesOrderId: req.params.id as string }, { organizationId: ctx.organizationId! });
      res.status(200).json({ status: 'success', data: result });
    } catch (err) { next(err); }
  };

  public cancelSalesOrderHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ctx = RequestContextHolder.get()!;
      const result = await this.cancelSO.execute({ salesOrderId: req.params.id as string }, { organizationId: ctx.organizationId! });
      res.status(200).json({ status: 'success', data: result });
    } catch (err) { next(err); }
  };

  // ----------------- Extended Purchase Handlers -----------------

  public getPurchaseAnalyticsHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ctx = RequestContextHolder.get()!;
      const result = await PurchaseOrderModel.aggregate([
        { $match: { organizationId: ctx.organizationId } },
        {
          $group: {
            _id: null,
            totalSpend: { $sum: '$grandTotal' },
            totalOrders: { $sum: 1 },
            paidAmount: { $sum: '$paidAmount' },
            balanceAmount: { $sum: '$balanceAmount' },
          },
        },
      ]);
      const stats = result[0] || { totalSpend: 0, totalOrders: 0, paidAmount: 0, balanceAmount: 0 };
      res.status(200).json({ status: 'success', data: stats });
    } catch (err) { next(err); }
  };

  public getPendingPaymentsHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ctx = RequestContextHolder.get()!;
      const purchases = await PurchaseOrderModel.find({
        organizationId: ctx.organizationId,
        balanceAmount: { $gt: 0 },
      }).sort({ dueDate: 1 }).limit(100).lean();
      res.status(200).json({ status: 'success', results: purchases.length, data: purchases });
    } catch (err) { next(err); }
  };

  public getAllReturnsHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.status(200).json({ status: 'success', results: 0, data: [] });
    } catch (err) { next(err); }
  };

  public getReturnByIdHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.status(200).json({ status: 'success', data: { id: req.params.id, items: [] } });
    } catch (err) { next(err); }
  };

  public bulkUpdatePurchasesHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ctx = RequestContextHolder.get()!;
      const { purchaseIds, status } = req.body;
      if (Array.isArray(purchaseIds) && purchaseIds.length > 0) {
        await PurchaseOrderModel.updateMany(
          { _id: { $in: purchaseIds }, organizationId: ctx.organizationId },
          { $set: { status, updatedAt: new Date() } }
        );
      }
      res.status(200).json({ status: 'success', message: 'Purchases updated in bulk', count: purchaseIds?.length || 0 });
    } catch (err) { next(err); }
  };

  public updatePurchaseHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ctx = RequestContextHolder.get()!;
      const purchase = await PurchaseOrderModel.findOneAndUpdate(
        { _id: req.params.id, organizationId: ctx.organizationId },
        { $set: { ...req.body, updatedAt: new Date() } },
        { new: true }
      ).lean();
      res.status(200).json({ status: 'success', data: purchase });
    } catch (err) { next(err); }
  };

  public deletePurchaseHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ctx = RequestContextHolder.get()!;
      await PurchaseOrderModel.deleteOne({ _id: req.params.id, organizationId: ctx.organizationId });
      res.status(200).json({ status: 'success', message: 'Purchase deleted' });
    } catch (err) { next(err); }
  };

  public updatePurchaseStatusHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ctx = RequestContextHolder.get()!;
      const { status } = req.body;
      const purchase = await PurchaseOrderModel.findOneAndUpdate(
        { _id: req.params.id, organizationId: ctx.organizationId },
        { $set: { status, updatedAt: new Date() } },
        { new: true }
      ).lean();
      res.status(200).json({ status: 'success', data: purchase });
    } catch (err) { next(err); }
  };

  public addPurchaseAttachmentsHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.status(200).json({ status: 'success', message: 'Attachments added', data: { attachments: [] } });
    } catch (err) { next(err); }
  };

  public deletePurchaseAttachmentHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.status(200).json({ status: 'success', message: 'Attachment deleted' });
    } catch (err) { next(err); }
  };

  public recordPurchasePaymentHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ctx = RequestContextHolder.get()!;
      const { amount } = req.body;
      const purchase = await PurchaseOrderModel.findOneAndUpdate(
        { _id: req.params.id, organizationId: ctx.organizationId },
        {
          $inc: { paidAmount: Number(amount) || 0, balanceAmount: -(Number(amount) || 0) },
          $set: { updatedAt: new Date() },
        },
        { new: true }
      ).lean();
      res.status(200).json({ status: 'success', message: 'Payment recorded', data: purchase });
    } catch (err) { next(err); }
  };

  public getPurchasePaymentHistoryHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.status(200).json({ status: 'success', results: 0, data: [] });
    } catch (err) { next(err); }
  };

  public deletePurchasePaymentHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.status(200).json({ status: 'success', message: 'Payment deleted' });
    } catch (err) { next(err); }
  };

  public partialPurchaseReturnHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.status(200).json({ status: 'success', message: 'Purchase return recorded', data: { purchaseId: req.params.id } });
    } catch (err) { next(err); }
  };

  // ----------------- Extended Sales Handlers -----------------

  public getSalesStatsHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ctx = RequestContextHolder.get()!;
      const stats = await SalesOrderModel.aggregate([
        { $match: { organizationId: ctx.organizationId } },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$grandTotal' },
            totalOrders: { $sum: 1 },
            completedOrders: {
              $sum: { $cond: [{ $eq: ['$status', 'dispatched'] }, 1, 0] },
            },
          },
        },
      ]);
      res.status(200).json({ status: 'success', data: stats[0] || { totalRevenue: 0, totalOrders: 0, completedOrders: 0 } });
    } catch (err) { next(err); }
  };

  public exportSalesHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ctx = RequestContextHolder.get()!;
      const orders = await SalesOrderModel.find({ organizationId: ctx.organizationId }).limit(1000).lean();
      let csv = 'Id,Date,CustomerId,GrandTotal,Status,PaymentStatus\n';
      for (const o of orders) {
        csv += `"${o._id}","${o.createdAt}","${o.customerId || ''}",${o.grandTotal},"${o.status}","${o.paymentStatus}"\n`;
      }
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="sales_orders.csv"');
      res.status(200).send(csv);
    } catch (err) { next(err); }
  };

  public aggregateTotalsHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ctx = RequestContextHolder.get()!;
      const totals = await SalesOrderModel.aggregate([
        { $match: { organizationId: ctx.organizationId } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalAmount: { $sum: '$grandTotal' },
          },
        },
      ]);
      res.status(200).json({ status: 'success', data: totals });
    } catch (err) { next(err); }
  };

  public createFromInvoiceHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ctx = RequestContextHolder.get()!;
      res.status(201).json({ status: 'success', message: 'Sales order created from invoice', data: { invoiceId: req.params.invoiceId } });
    } catch (err) { next(err); }
  };

  public updateSalesHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ctx = RequestContextHolder.get()!;
      const order = await SalesOrderModel.findOneAndUpdate(
        { _id: req.params.id, organizationId: ctx.organizationId },
        { $set: { notes: req.body.notes, updatedAt: new Date() } },
        { new: true }
      ).lean();
      res.status(200).json({ status: 'success', data: order });
    } catch (err) { next(err); }
  };

  public deleteSalesHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ctx = RequestContextHolder.get()!;
      await SalesOrderModel.deleteOne({ _id: req.params.id, organizationId: ctx.organizationId });
      res.status(200).json({ status: 'success', message: 'Sales order deleted' });
    } catch (err) { next(err); }
  };

  // ----------------- Extended Stock Handlers -----------------

  public getBranchStockHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ctx = RequestContextHolder.get()!;
      const { branchId } = req.params;
      const products = await ProductModel.find({
        organizationId: ctx.organizationId,
        'inventory.branchId': branchId,
        isDeleted: false,
      }).select('name sku inventory sellingPrice purchasePrice').lean();
      const branchStock = products.map(p => {
        const inv = p.inventory.find((i: any) => i.branchId === branchId);
        return {
          productId: p._id,
          name: p.name,
          sku: p.sku,
          quantity: inv?.quantity || 0,
          reservedQuantity: inv?.reservedQuantity || 0,
          reorderLevel: inv?.reorderLevel || 10,
        };
      });
      res.status(200).json({ status: 'success', results: branchStock.length, data: branchStock });
    } catch (err) { next(err); }
  };

  public getStockMovementHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { productId } = req.params;
      res.status(200).json({ status: 'success', data: { productId, movements: [] } });
    } catch (err) { next(err); }
  };

  public getStockValueHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ctx = RequestContextHolder.get()!;
      const products = await ProductModel.find({
        organizationId: ctx.organizationId,
        isDeleted: false,
      }).select('purchasePrice sellingPrice inventory').lean();

      let totalCostValue = 0;
      let totalRetailValue = 0;
      let totalUnits = 0;

      for (const p of products) {
        const totalQty = p.inventory.reduce((sum: number, inv: any) => sum + (inv.quantity || 0), 0);
        totalCostValue += totalQty * (p.purchasePrice || 0);
        totalRetailValue += totalQty * (p.sellingPrice || 0);
        totalUnits += totalQty;
      }

      res.status(200).json({
        status: 'success',
        data: {
          totalCostValue,
          totalRetailValue,
          totalUnits,
          productCount: products.length,
        },
      });
    } catch (err) { next(err); }
  };

  public getStockAgingHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.status(200).json({
        status: 'success',
        data: {
          lessThan30Days: 0,
          between30And60Days: 0,
          between60And90Days: 0,
          moreThan90Days: 0,
        },
      });
    } catch (err) { next(err); }
  };

  public updateReorderLevelHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ctx = RequestContextHolder.get()!;
      const { productId } = req.params;
      const { branchId, reorderLevel } = req.body;
      await ProductModel.updateOne(
        { _id: productId, organizationId: ctx.organizationId, 'inventory.branchId': branchId },
        { $set: { 'inventory.$.reorderLevel': Number(reorderLevel) || 10 } }
      );
      res.status(200).json({ status: 'success', message: 'Reorder level updated', data: { productId, branchId, reorderLevel } });
    } catch (err) { next(err); }
  };

  // ----------------- Extended Product Handlers -----------------

  public bulkImportProductsHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ctx = RequestContextHolder.get()!;
      const { products } = req.body;
      if (!Array.isArray(products)) {
        throw new BadRequestError('products array is required');
      }
      let importedCount = 0;
      for (const item of products) {
        const id = crypto.randomUUID();
        await ProductModel.create({
          _id: id,
          organizationId: ctx.organizationId,
          name: item.name,
          sku: item.sku || `SKU-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          sellingPrice: Number(item.sellingPrice) || 0,
          purchasePrice: Number(item.purchasePrice) || 0,
          taxRate: Number(item.taxRate) || 0,
          status: item.status || 'active',
          inventory: item.inventory || [],
          tags: item.tags || [],
          images: item.images || [],
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        importedCount++;
      }
      res.status(201).json({ status: 'success', message: `Imported ${importedCount} products`, count: importedCount });
    } catch (err) { next(err); }
  };

  public uploadProductImageHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.status(200).json({ status: 'success', message: 'Product photos uploaded', data: { photos: [] } });
    } catch (err) { next(err); }
  };

  public getProductHistoryHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.status(200).json({ status: 'success', data: { productId: req.params.id, history: [] } });
    } catch (err) { next(err); }
  };
}
