import { Router } from 'express';
import { StorefrontPublicController } from '../controllers/storefrontPublic.controller';

export function createStorefrontPublicRoutes(controller: StorefrontPublicController): Router {
  const router = Router();

  router.get('/pages/:slug', controller.getPageHandler);
  router.post('/orders', controller.checkoutHandler);

  return router;
}
