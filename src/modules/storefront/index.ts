import { Router } from 'express';
import { Connection } from 'mongoose';
import { StorefrontAdminController } from './presentation/controllers/storefrontAdmin.controller';
import { StorefrontPublicController } from './presentation/controllers/storefrontPublic.controller';
import { DeliveryAgentController } from './presentation/controllers/deliveryAgent.controller';
import { PlatformDeliveryController } from './presentation/controllers/platformDelivery.controller';
import { StorefrontFormController } from './presentation/controllers/storefrontForm.controller';
import { createStorefrontAdminRoutes } from './presentation/routes/storefrontAdmin.routes';
import { createStorefrontPublicRoutes } from './presentation/routes/storefrontPublic.routes';
import { createSmartRuleRoutes } from './presentation/routes/smartRule.routes';
import { createDeliveryAgentRoutes } from './presentation/routes/delivery.routes';
import { createPlatformDeliveryRoutes } from './presentation/routes/platformDelivery.routes';
import { createStorefrontFormRoutes } from './presentation/routes/storefrontForm.routes';
import { InMemoryStorefrontPageRepository } from './infrastructure/repositories/InMemoryStorefrontPageRepository';
import { MongoStorefrontPageRepository } from './infrastructure/repositories/MongoStorefrontPageRepository';
import { InMemoryStorefrontOrderRepository } from './infrastructure/repositories/InMemoryStorefrontOrderRepository';
import { MongoStorefrontOrderRepository } from './infrastructure/repositories/MongoStorefrontOrderRepository';
import { CreateStorefrontPageUseCase } from './application/use-cases/CreateStorefrontPageUseCase';
import { PublishStorefrontPageUseCase } from './application/use-cases/PublishStorefrontPageUseCase';
import { ListStorefrontPagesUseCase } from './application/use-cases/ListStorefrontPagesUseCase';
import { GetPublicPageBySlugUseCase } from './application/use-cases/GetPublicPageBySlugUseCase';
import { CreateStorefrontOrderUseCase } from './application/use-cases/CreateStorefrontOrderUseCase';
import { StorefrontCRMBridgeService } from './application/services/StorefrontCRMBridgeService';
import { SmartRuleEngine } from './application/services/SmartRuleEngine';
import { ITokenService } from '../../infrastructure/security/ITokenService';
import { IEventBus } from '../../infrastructure/messaging/IEventBus';
import { IUnitOfWork } from '../../core/application/IUnitOfWork';
import { MongoUnitOfWork } from '../../infrastructure/database/MongoUnitOfWork';

import { MongoProductRepository } from '../inventory/infrastructure/repositories/MongoProductRepository';
import { IProductRepository } from '../inventory/domain/ports/IProductRepository';

export interface StorefrontModule {
  adminRoutes: Router;
  publicRoutes: Router;
  smartRuleRoutes: Router;
  deliveryRoutes: Router;
  platformDeliveryRoutes: Router;
  formRoutes: Router;
  adminController: StorefrontAdminController;
  publicController: StorefrontPublicController;
  deliveryAgentController: DeliveryAgentController;
  platformDeliveryController: PlatformDeliveryController;
  formController: StorefrontFormController;
  crmBridgeService: StorefrontCRMBridgeService;
  smartRuleEngine: SmartRuleEngine;
}

export function createStorefrontModule(deps: {
  connection: Connection;
  tokenService: ITokenService;
  eventBus: IEventBus;
  productRepo?: IProductRepository;
  useInMemory?: boolean;
}): StorefrontModule {
  const uow: IUnitOfWork = new MongoUnitOfWork(deps.connection);

  // Repositories
  const pageRepo = deps.useInMemory
    ? new InMemoryStorefrontPageRepository()
    : new MongoStorefrontPageRepository();
  const orderRepo = deps.useInMemory
    ? new InMemoryStorefrontOrderRepository()
    : new MongoStorefrontOrderRepository();
  const productRepo = deps.productRepo || new MongoProductRepository();

  // Services
  const crmBridgeService = new StorefrontCRMBridgeService(deps.eventBus);
  crmBridgeService.initialize();
  const smartRuleEngine = new SmartRuleEngine();

  // Use Cases
  const createPageUC = new CreateStorefrontPageUseCase(pageRepo, deps.eventBus);
  const publishPageUC = new PublishStorefrontPageUseCase(pageRepo, deps.eventBus);
  const listPagesUC = new ListStorefrontPagesUseCase(pageRepo);
  const getPageBySlugUC = new GetPublicPageBySlugUseCase(pageRepo);
  const createOrderUC = new CreateStorefrontOrderUseCase(orderRepo, deps.eventBus, uow, productRepo);

  // Controllers
  const adminController = new StorefrontAdminController(createPageUC, publishPageUC, listPagesUC);
  const publicController = new StorefrontPublicController(getPageBySlugUC, createOrderUC);
  const deliveryAgentController = new DeliveryAgentController();
  const platformDeliveryController = new PlatformDeliveryController();
  const formController = new StorefrontFormController();

  // Routes
  const adminRoutes = createStorefrontAdminRoutes(adminController, deps.tokenService);
  const publicRoutes = createStorefrontPublicRoutes(publicController);
  const smartRuleRoutes = createSmartRuleRoutes(adminController, deps.tokenService);
  const deliveryRoutes = createDeliveryAgentRoutes(deliveryAgentController, deps.tokenService);
  const platformDeliveryRoutes = createPlatformDeliveryRoutes(platformDeliveryController, deps.tokenService);
  const formRoutes = createStorefrontFormRoutes(formController, deps.tokenService);

  return {
    adminRoutes,
    publicRoutes,
    smartRuleRoutes,
    deliveryRoutes,
    platformDeliveryRoutes,
    formRoutes,
    adminController,
    publicController,
    deliveryAgentController,
    platformDeliveryController,
    formController,
    crmBridgeService,
    smartRuleEngine,
  };
}
