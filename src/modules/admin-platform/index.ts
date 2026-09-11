import { Router } from 'express';
import { Connection } from 'mongoose';
import { IAdminPlatformRepository } from './domain/ports/IAdminPlatformRepository';
import { InMemoryAdminPlatformRepository } from './infrastructure/repositories/InMemoryAdminPlatformRepository';
import { MongoAdminPlatformRepository } from './infrastructure/repositories/MongoAdminPlatformRepository';
import { AdminPlatformUseCases } from './application/use-cases/AdminPlatformUseCases';
import { AdminPlatformController } from './presentation/controllers/adminPlatform.controller';
import { createAdminPlatformRouter } from './presentation/routes/adminPlatform.routes';
import { createInternalPlatformRouter } from './presentation/routes/internal.routes';

export interface AdminPlatformModule {
  platformRouter: Router;
  internalRouter: Router;
  repository: IAdminPlatformRepository;
  useCases: AdminPlatformUseCases;
  controller: AdminPlatformController;
}

export function createAdminPlatformModule(deps: {
  connection: Connection;
  useInMemory?: boolean;
}): AdminPlatformModule {
  const repository: IAdminPlatformRepository = deps.useInMemory
    ? new InMemoryAdminPlatformRepository()
    : new MongoAdminPlatformRepository();

  const useCases = new AdminPlatformUseCases(repository);
  const controller = new AdminPlatformController(useCases);
  const platformRouter = createAdminPlatformRouter(controller);
  const internalRouter = createInternalPlatformRouter(controller);

  return {
    platformRouter,
    internalRouter,
    repository,
    useCases,
    controller,
  };
}
