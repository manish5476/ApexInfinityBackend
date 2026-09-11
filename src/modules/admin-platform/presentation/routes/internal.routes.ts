import { Router } from 'express';
import { AdminPlatformController } from '../controllers/adminPlatform.controller';

export function createInternalPlatformRouter(ctrl: AdminPlatformController): Router {
  const router = Router();

  router.get('/database-inspector', ctrl.databaseInspector);
  router.post('/cache/clear', ctrl.clearCache);
  router.get('/logs', ctrl.logs);
  router.post('/api-tester', ctrl.apiTester);
  router.get('/queues', ctrl.queueMonitor);
  router.get('/audit', ctrl.auditLogs);

  return router;
}
