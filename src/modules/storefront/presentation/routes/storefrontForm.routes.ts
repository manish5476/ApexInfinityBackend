import { Router } from 'express';
import { StorefrontFormController } from '../controllers/storefrontForm.controller';
import { ITokenService } from '../../../../infrastructure/security/ITokenService';
import { createAuthMiddleware } from '../../../../middleware/auth.middleware';

export function createStorefrontFormRoutes(
  controller: StorefrontFormController,
  tokenService?: ITokenService
): Router {
  const router = Router();
  const authGuard = tokenService ? createAuthMiddleware(tokenService) : (_req: any, _res: any, next: any) => next();

  // Public form submission
  router.post('/store/:uniqueShopId/forms/submit', controller.submitForm);
  router.post('/:uniqueShopId/submit', controller.submitForm);

  // Protected submissions management
  router.get('/storefront-forms/submissions', authGuard, controller.getSubmissions);
  router.patch('/storefront-forms/submissions/:id', authGuard, controller.updateSubmissionStatus);
  router.delete('/storefront-forms/submissions/:id', authGuard, controller.deleteSubmission);

  router.get('/submissions', authGuard, controller.getSubmissions);
  router.patch('/submissions/:id', authGuard, controller.updateSubmissionStatus);
  router.delete('/submissions/:id', authGuard, controller.deleteSubmission);

  return router;
}
