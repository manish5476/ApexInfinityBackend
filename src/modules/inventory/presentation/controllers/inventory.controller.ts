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
}
