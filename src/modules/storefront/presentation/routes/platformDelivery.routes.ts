import { Router } from 'express';
import { PlatformDeliveryController } from '../controllers/platformDelivery.controller';
import { ITokenService } from '../../../../infrastructure/security/ITokenService';
import { createAuthMiddleware } from '../../../../middleware/auth.middleware';

export function createPlatformDeliveryRoutes(
  controller: PlatformDeliveryController,
  tokenService?: ITokenService
): Router {
  const router = Router();
  const authGuard = tokenService ? createAuthMiddleware(tokenService) : (_req: any, _res: any, next: any) => next();

  // Public routes
  router.post('/register', controller.register);
  router.post('/login', controller.login);

  // Protected routes
  router.use(authGuard);

  router.patch('/update-password', controller.updatePassword);
  router.get('/orders', controller.getAvailableOrders);
  router.get('/scan/:identifier', controller.scanOrder);
  router.patch('/orders/:orderId/status', controller.updateOrderStatus);

  return router;
}
