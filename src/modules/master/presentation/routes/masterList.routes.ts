import { Router } from 'express';
import { MasterListController } from '../controllers/masterList.controller';
import { ITokenService } from '../../../../infrastructure/security/ITokenService';
import { createAuthMiddleware } from '../../../../middleware/auth.middleware';

export function createMasterListRoutes(controller: MasterListController, tokenService: ITokenService): Router {
  const router = Router();
  const authGuard = createAuthMiddleware(tokenService);
  router.use(authGuard);

  // Static and sub-resource routes
  router.get('/list', controller.getSpecificList);
  router.get('/filter-options', controller.getFilterOptions);
  router.get('/quick-stats', controller.getQuickStats);
  router.get('/details/:type/:id', controller.getEntityDetails);
  router.get('/export', controller.exportMasterList);
  router.get('/export-filtered', controller.exportFilteredData);
  router.get('/permissions', controller.getPermissionsMetadata);

  // Main snapshot route
  router.get('/', controller.getMasterList);

  return router;
}
