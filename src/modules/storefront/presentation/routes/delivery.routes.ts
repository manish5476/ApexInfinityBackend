import { Router } from 'express';
import { DeliveryAgentController } from '../controllers/deliveryAgent.controller';
import { ITokenService } from '../../../../infrastructure/security/ITokenService';
import { createAuthMiddleware } from '../../../../middleware/auth.middleware';

export function createDeliveryAgentRoutes(
  controller: DeliveryAgentController,
  tokenService?: ITokenService
): Router {
  const router = Router();
  const authGuard = tokenService ? createAuthMiddleware(tokenService) : (_req: any, _res: any, next: any) => next();

  // Public route for login
  router.post('/login', controller.login);
  router.post('/forgot-password', controller.forgotPassword);
  router.patch('/reset-password/:token', controller.resetPassword);

  // Protected routes
  router.use(authGuard);

  router.get('/profile', controller.getProfile);
  router.patch('/profile', controller.updateProfile);
  router.patch('/update-password', controller.updatePassword);
  router.get('/orders', controller.getAssignedOrders);
  router.get('/scan/:identifier', controller.scanOrder);
  router.patch('/orders/:orderId/status', controller.updateOrderStatus);

  return router;
}
