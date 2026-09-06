import { Router } from 'express';
import { Connection } from 'mongoose';
import { InventoryController } from './presentation/controllers/inventory.controller';
import {
  createInventoryRoutes,
  createProductRoutes,
  createStockRoutes,
  createPurchaseRoutes,
  createSalesRoutes,
} from './presentation/routes/inventory.routes';
import { MongoProductRepository } from './infrastructure/repositories/MongoProductRepository';
import { MongoPurchaseOrderRepository } from './infrastructure/repositories/MongoPurchaseOrderRepository';
import { MongoSalesOrderRepository } from './infrastructure/repositories/MongoSalesOrderRepository';
import { IProductRepository } from './domain/ports/IProductRepository';
import { IPurchaseOrderRepository } from './domain/ports/IPurchaseOrderRepository';
import { ISalesOrderRepository } from './domain/ports/ISalesOrderRepository';
import { CreateProductUseCase } from './application/use-cases/CreateProductUseCase';
import { ListProductsUseCase } from './application/use-cases/ListProductsUseCase';
import { GetProductByIdUseCase } from './application/use-cases/GetProductByIdUseCase';
import { UpdateProductUseCase } from './application/use-cases/UpdateProductUseCase';
import { DeleteProductUseCase } from './application/use-cases/DeleteProductUseCase';
import { RestoreProductUseCase } from './application/use-cases/RestoreProductUseCase';
import { SearchProductsUseCase } from './application/use-cases/SearchProductsUseCase';
import { ScanProductUseCase } from './application/use-cases/ScanProductUseCase';
import { GetLowStockProductsUseCase } from './application/use-cases/GetLowStockProductsUseCase';
import { AdjustStockUseCase } from './application/use-cases/AdjustStockUseCase';
import { TransferStockUseCase } from './application/use-cases/TransferStockUseCase';
import { BulkUpdateProductsUseCase } from './application/use-cases/BulkUpdateProductsUseCase';
import { CreatePurchaseOrderUseCase } from './application/use-cases/CreatePurchaseOrderUseCase';
import { ListPurchaseOrdersUseCase } from './application/use-cases/ListPurchaseOrdersUseCase';
import { GetPurchaseOrderByIdUseCase } from './application/use-cases/GetPurchaseOrderByIdUseCase';
import { ReceiveStockUseCase } from './application/use-cases/ReceiveStockUseCase';
import { CancelPurchaseOrderUseCase } from './application/use-cases/CancelPurchaseOrderUseCase';
import { CreateSalesOrderUseCase } from './application/use-cases/CreateSalesOrderUseCase';
import { ListSalesOrdersUseCase } from './application/use-cases/ListSalesOrdersUseCase';
import { GetSalesOrderByIdUseCase } from './application/use-cases/GetSalesOrderByIdUseCase';
import { DispatchSalesOrderUseCase } from './application/use-cases/DispatchSalesOrderUseCase';
import { CancelSalesOrderUseCase } from './application/use-cases/CancelSalesOrderUseCase';
import { ITokenService } from '../../infrastructure/security/ITokenService';
import { IEventBus } from '../../infrastructure/messaging/IEventBus';
import { IUnitOfWork } from '../../core/application/IUnitOfWork';
import { MongoUnitOfWork } from '../../infrastructure/database/MongoUnitOfWork';

export interface InventoryModule {
  routes: Router;
  productRoutes: Router;
  stockRoutes: Router;
  purchaseRoutes: Router;
  salesRoutes: Router;
  productRepo: IProductRepository;
  poRepo: IPurchaseOrderRepository;
  soRepo: ISalesOrderRepository;
}

export function createInventoryModule(deps: {
  connection: Connection;
  tokenService: ITokenService;
  eventBus: IEventBus;
  uow?: IUnitOfWork;
}): InventoryModule {
  const uow: IUnitOfWork = deps.uow || new MongoUnitOfWork(deps.connection);

  // Repositories
  const productRepo = new MongoProductRepository();
  const poRepo = new MongoPurchaseOrderRepository();
  const soRepo = new MongoSalesOrderRepository();

  // Use Cases - Products
  const createProductUC = new CreateProductUseCase(productRepo, deps.eventBus);
  const listProductsUC = new ListProductsUseCase(productRepo);
  const getProductByIdUC = new GetProductByIdUseCase(productRepo);
  const updateProductUC = new UpdateProductUseCase(productRepo);
  const deleteProductUC = new DeleteProductUseCase(productRepo);
  const restoreProductUC = new RestoreProductUseCase(productRepo);
  const searchProductsUC = new SearchProductsUseCase(productRepo);
  const scanProductUC = new ScanProductUseCase(productRepo);
  const getLowStockUC = new GetLowStockProductsUseCase(productRepo);
  const adjustStockUC = new AdjustStockUseCase(productRepo);
  const transferStockUC = new TransferStockUseCase(productRepo);
  const bulkUpdateProductsUC = new BulkUpdateProductsUseCase(productRepo);

  // Use Cases - Purchase Orders
  const createPOUC = new CreatePurchaseOrderUseCase(poRepo, uow);
  const listPOsUC = new ListPurchaseOrdersUseCase(poRepo);
  const getPOByIdUC = new GetPurchaseOrderByIdUseCase(poRepo);
  const receiveStockUC = new ReceiveStockUseCase(poRepo, productRepo, deps.eventBus, uow);
  const cancelPOUC = new CancelPurchaseOrderUseCase(poRepo);

  // Use Cases - Sales Orders
  const createSOUC = new CreateSalesOrderUseCase(soRepo, productRepo, uow);
  const listSOsUC = new ListSalesOrdersUseCase(soRepo);
  const getSOByIdUC = new GetSalesOrderByIdUseCase(soRepo);
  const dispatchSOUC = new DispatchSalesOrderUseCase(soRepo, productRepo, deps.eventBus, uow);
  const cancelSOUC = new CancelSalesOrderUseCase(soRepo);

  // Controller
  const controller = new InventoryController(
    createProductUC,
    listProductsUC,
    getProductByIdUC,
    updateProductUC,
    deleteProductUC,
    restoreProductUC,
    searchProductsUC,
    scanProductUC,
    getLowStockUC,
    adjustStockUC,
    transferStockUC,
    bulkUpdateProductsUC,
    createPOUC,
    listPOsUC,
    getPOByIdUC,
    receiveStockUC,
    cancelPOUC,
    createSOUC,
    listSOsUC,
    getSOByIdUC,
    dispatchSOUC,
    cancelSOUC
  );

  // Routes
  const routes = createInventoryRoutes(controller, deps.tokenService);
  const productRoutes = createProductRoutes(controller, deps.tokenService);
  const stockRoutes = createStockRoutes(controller, deps.tokenService);
  const purchaseRoutes = createPurchaseRoutes(controller, deps.tokenService);
  const salesRoutes = createSalesRoutes(controller, deps.tokenService);

  return {
    routes,
    productRoutes,
    stockRoutes,
    purchaseRoutes,
    salesRoutes,
    productRepo,
    poRepo,
    soRepo,
  };
}
