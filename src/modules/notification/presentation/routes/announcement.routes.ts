import { Router } from 'express';
import { AnnouncementController } from '../controllers/announcement.controller';
import { ITokenService } from '../../../../infrastructure/security/ITokenService';
import { createAuthMiddleware } from '../../../../middleware/auth.middleware';

export function createAnnouncementRoutes(controller: AnnouncementController, tokenService: ITokenService): Router {
  const router = Router();
  const authGuard = createAuthMiddleware(tokenService);
  router.use(authGuard);

  router.get('/stats', controller.getAnnouncementStats);
  router.get('/search', controller.searchAnnouncements);
  router.get('/', controller.getAllAnnouncements);
  router.post('/', controller.createAnnouncement);
  router.patch('/:id/read', controller.markAsRead);
  router.patch('/:id', controller.updateAnnouncement);
  router.delete('/:id', controller.deleteAnnouncement);

  return router;
}
