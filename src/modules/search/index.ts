import { Router } from 'express';
import { SearchController } from './presentation/controllers/search.controller';
import { createSearchRoutes } from './presentation/routes/search.routes';
import { ITokenService } from '../../infrastructure/security/ITokenService';

export interface SearchModuleDependencies {
  tokenService?: ITokenService;
}

export interface SearchModule {
  controller: SearchController;
  routes: Router;
}

export function createSearchModule(deps: SearchModuleDependencies = {}): SearchModule {
  const controller = new SearchController();
  const routes = createSearchRoutes(controller, deps.tokenService);

  return {
    controller,
    routes,
  };
}
