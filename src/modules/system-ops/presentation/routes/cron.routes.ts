import { Router } from 'express';
import { CronController } from '../controllers/cron.controller';
import { ITokenService } from '../../../../infrastructure/security/ITokenService';
import { createAuthMiddleware } from '../../../../middleware/auth.middleware';

export function createCronRoutes(
  controller: CronController,
  tokenService?: ITokenService
): Router {
  const router = Router();
  const authGuard = tokenService ? createAuthMiddleware(tokenService) : (_req: any, _res: any, next: any) => next();

  router.use(authGuard);

  router.get('/status', controller.getCronStatus);
  router.post('/:job/trigger', controller.triggerCronJob);
  router.post('/stop', controller.stopCronJobs);

  return router;
}
