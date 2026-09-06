import { Router } from 'express';
import { HealthController } from './health.controller';

export function createHealthRoutes(controller: HealthController): Router {
  const router = Router();

  router.get('/', controller.getHealth);
  router.get('/live', controller.getLive);
  router.get('/ready', controller.getReady);

  return router;
}
