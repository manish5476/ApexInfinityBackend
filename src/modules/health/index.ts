import { Router } from 'express';
import { HealthController } from './presentation/health.controller';
import { createHealthRoutes } from './presentation/health.routes';
import { MongoConnectionManager } from '../../infrastructure/database';
import { ICache } from '../../infrastructure/cache';

export interface HealthModuleDependencies {
  dbManager: MongoConnectionManager;
  cache?: ICache;
}

export interface HealthModule {
  controller: HealthController;
  routes: Router;
}

export function createHealthModule(deps: HealthModuleDependencies): HealthModule {
  const controller = new HealthController(deps.dbManager, deps.cache);
  const routes = createHealthRoutes(controller);

  return {
    controller,
    routes,
  };
}
