import { Router } from 'express';
import { Connection } from 'mongoose';
import { IAdminPlatformRepository } from './domain/ports/IAdminPlatformRepository';
import { InMemoryAdminPlatformRepository } from './infrastructure/repositories/InMemoryAdminPlatformRepository';
import { MongoAdminPlatformRepository } from './infrastructure/repositories/MongoAdminPlatformRepository';
import { AdminPlatformUseCases } from './application/use-cases/AdminPlatformUseCases';
import { AdminPlatformController } from './presentation/controllers/adminPlatform.controller';
import { createAdminPlatformRouter } from './presentation/routes/adminPlatform.routes';
import { createInternalPlatformRouter } from './presentation/routes/internal.routes';

import { AdminAnalyticsController } from './presentation/controllers/adminAnalytics.controller';
import { createAdminAnalyticsRoutes } from './presentation/routes/adminAnalytics.routes';
import { ITokenService } from '../../infrastructure/security/ITokenService';

export interface AdminPlatformModule {
  platformRouter: Router;
  internalRouter: Router;
  adminAnalyticsRoutes: Router;
  repository: IAdminPlatformRepository;
  useCases: AdminPlatformUseCases;
  controller: AdminPlatformController;
  adminAnalyticsController: AdminAnalyticsController;
}

export function createAdminPlatformModule(deps: {
  connection: Connection;
  useInMemory?: boolean;
  tokenService?: ITokenService;
}): AdminPlatformModule {
  const repository: IAdminPlatformRepository = deps.useInMemory
    ? new InMemoryAdminPlatformRepository()
    : new MongoAdminPlatformRepository();

  const useCases = new AdminPlatformUseCases(repository);
  const controller = new AdminPlatformController(useCases);
  const platformRouter = createAdminPlatformRouter(controller);
  const internalRouter = createInternalPlatformRouter(controller);
  const adminAnalyticsController = new AdminAnalyticsController();
  const adminAnalyticsRoutes = createAdminAnalyticsRoutes(adminAnalyticsController, deps.tokenService);

  return {
    platformRouter,
    internalRouter,
    adminAnalyticsRoutes,
    repository,
    useCases,
    controller,
    adminAnalyticsController,
  };
}
