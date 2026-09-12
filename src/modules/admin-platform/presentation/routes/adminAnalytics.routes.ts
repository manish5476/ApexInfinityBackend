import { Router } from 'express';
import { AdminAnalyticsController } from '../controllers/adminAnalytics.controller';
import { ITokenService } from '../../../../infrastructure/security/ITokenService';
import { createAuthMiddleware } from '../../../../middleware/auth.middleware';

export function createAdminAnalyticsRoutes(
  controller: AdminAnalyticsController,
  tokenService?: ITokenService
): Router {
  const router = Router();
  const authGuard = tokenService ? createAuthMiddleware(tokenService) : (_req: any, _res: any, next: any) => next();

  router.use(authGuard);

  router.get('/summary', controller.summary);
  router.get('/monthly', controller.monthlyTrends);
  router.get('/outstanding', controller.outstanding);
  router.get('/top-customers', controller.topCustomers);
  router.get('/top-products', controller.topProducts);
  router.get('/branch-performance', controller.branchSales);
  router.get('/branch-sales', controller.branchSales);

  return router;
}
