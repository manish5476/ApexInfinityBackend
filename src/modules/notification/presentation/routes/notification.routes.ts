import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';
import { ITokenService } from '../../../../infrastructure/security/ITokenService';
import { createAuthMiddleware } from '../../../../middleware/auth.middleware';

export function createNotificationRoutes(controller: NotificationController, tokenService: ITokenService): Router {
  const router = Router();
  const authGuard = createAuthMiddleware(tokenService);
  router.use(authGuard);

  // 1. Static and summary routes
  router.get('/stats', controller.getNotificationStats);
  router.get('/unread-count', controller.getUnreadCount);
  router.get('/my-notifications', controller.getMyNotifications);

  // Bulk actions
  router.patch('/mark-read', controller.markMultipleAsRead);
  router.patch('/mark-all-read', controller.markAllRead);
  router.patch('/read-all', controller.markAllRead);
  router.delete('/clear-all', controller.clearAll);

  // 2. Collection root routes
  router.get('/', controller.getMyNotifications);
  router.post('/', controller.sendNotificationHandler);

  // 3. ID-based routes
  router.get('/:id', controller.getNotification);
  router.patch('/:id/read', controller.markAsRead);
  router.patch('/:id', controller.markAsRead);
  router.delete('/:id', controller.deleteNotification);

  return router;
}
