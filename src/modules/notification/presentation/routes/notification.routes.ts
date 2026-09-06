import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';
import { ITokenService } from '../../../../infrastructure/security/ITokenService';
import { createAuthMiddleware } from '../../../../middleware/auth.middleware';

export function createNotificationRoutes(controller: NotificationController, tokenService: ITokenService): Router {
  const router = Router();
  const authGuard = createAuthMiddleware(tokenService);
  router.use(authGuard);

  router.post('/', controller.sendNotificationHandler);
  router.get('/', controller.listNotificationsHandler);
  router.patch('/:id/read', controller.markReadHandler);

  return router;
}
