import { Router } from 'express';
import { StorefrontAdminController } from '../controllers/storefrontAdmin.controller';
import { ITokenService } from '../../../../infrastructure/security/ITokenService';
import { createAuthMiddleware } from '../../../../middleware/auth.middleware';

export function createSmartRuleRoutes(
  controller: StorefrontAdminController,
  tokenService?: ITokenService
): Router {
  const router = Router();
  const authGuard = tokenService ? createAuthMiddleware(tokenService) : (_req: any, _res: any, next: any) => next();

  router.use(authGuard);

  router.route('/')
    .get(controller.getAllRules)
    .post(controller.createRule);

  router.post('/preview', controller.previewRule);

  router.route('/:ruleId')
    .get(controller.getRuleById)
    .put(controller.updateRule)
    .delete(controller.deleteRule);

  router.post('/:ruleId/execute', controller.executeRule);
  router.post('/:ruleId/clear-cache', controller.clearRuleCache);
  router.delete('/:ruleId/cache', controller.clearRuleCache);

  return router;
}
