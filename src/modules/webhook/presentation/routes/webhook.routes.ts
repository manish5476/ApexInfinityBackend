import { Router } from 'express';
import { WebhookController } from '../controllers/webhook.controller';
import { ITokenService } from '../../../../infrastructure/security/ITokenService';
import { createAuthMiddleware } from '../../../../middleware/auth.middleware';

export function createWebhookRoutes(controller: WebhookController, tokenService: ITokenService): Router {
  const router = Router();
  const authGuard = createAuthMiddleware(tokenService);
  router.use(authGuard);

  router.post('/', controller.registerWebhookHandler);
  router.get('/', controller.listWebhooksHandler);
  router.post('/test-trigger', controller.testTriggerHandler);

  return router;
}
