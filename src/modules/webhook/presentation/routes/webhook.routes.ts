import { Router } from 'express';
import { WebhookController } from '../controllers/webhook.controller';
import { ITokenService } from '../../../../infrastructure/security/ITokenService';
import { createAuthMiddleware } from '../../../../middleware/auth.middleware';

export function createWebhookRoutes(controller: WebhookController, tokenService: ITokenService): Router {
  const router = Router();
  const authGuard = createAuthMiddleware(tokenService);
  router.use(authGuard);

  // Static/action routes before parameter routes
  router.post('/test-trigger', controller.testTriggerHandler);
  router.get('/stats', controller.getWebhookStatsHandler);
  router.get('/deliveries', controller.listDeliveriesHandler);
  router.post('/deliveries/:deliveryId/replay', controller.replayDeliveryHandler);

  // Base resource routes
  router.post('/', controller.registerWebhookHandler);
  router.get('/', controller.listWebhooksHandler);

  // Parameterized resource routes
  router.get('/:id', controller.getWebhookHandler);
  router.patch('/:id', controller.updateWebhookHandler);
  router.put('/:id', controller.updateWebhookHandler);
  router.delete('/:id', controller.deleteWebhookHandler);
  router.post('/:id/test', controller.testWebhookHandler);

  return router;
}
