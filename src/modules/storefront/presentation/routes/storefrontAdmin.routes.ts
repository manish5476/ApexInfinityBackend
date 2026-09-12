import { Router } from 'express';
import { StorefrontAdminController } from '../controllers/storefrontAdmin.controller';
import { ITokenService } from '../../../../infrastructure/security/ITokenService';
import { createAuthMiddleware } from '../../../../middleware/auth.middleware';

export function createStorefrontAdminRoutes(
  controller: StorefrontAdminController,
  tokenService?: ITokenService
): Router {
  const router = Router();
  const authGuard = tokenService ? createAuthMiddleware(tokenService) : (_req: any, _res: any, next: any) => next();

  router.use(authGuard);

  // Layout
  router.route('/layout')
    .get(controller.getLayout)
    .put(controller.updateLayout);
  router.delete('/layout/reset', controller.resetLayout);

  // Builder Catalogue
  router.get('/themes', controller.getAvailableThemes);
  router.get('/sections', controller.getSectionTypes);
  router.get('/section-types', controller.getSectionTypes);
  router.get('/templates', controller.getTemplates);

  // Pages
  router.route('/pages')
    .get(controller.getPages)
    .post(controller.createPageHandler);

  router.route('/pages/:pageId')
    .get(controller.getPageById)
    .put(controller.updatePage)
    .delete(controller.deletePage);

  router.post('/pages/:pageId/publish', controller.publishPageHandler);
  router.post('/pages/:pageId/unpublish', controller.unpublishPage);
  router.post('/pages/:pageId/set-homepage', controller.setHomepage);
  router.post('/pages/:pageId/duplicate', controller.duplicatePage);
  router.get('/pages/:pageId/analytics', controller.getPageAnalytics);
  router.get('/pages/:pageId/preview', controller.getDraftPreview);

  // Orders & Command Center
  router.get('/command-center', controller.getCommandCenter);
  router.get('/orders', controller.getAllOrders);
  router.put('/orders/:orderId/status', controller.updateOrderStatus);
  router.patch('/orders/:orderId/assign-agent', controller.assignDeliveryAgent);

  // Delivery Agents
  router.route('/delivery-agents')
    .get(controller.getDeliveryAgents)
    .post(controller.createDeliveryAgent);

  router.route('/delivery-agents/:agentId')
    .get(controller.getDeliveryAgentById)
    .put(controller.updateDeliveryAgent)
    .delete(controller.deleteDeliveryAgent);

  router.post('/delivery-agents/:agentId/send-invite', controller.sendDeliveryAgentInvite);

  // Coupons
  router.route('/coupons')
    .get(controller.getCoupons)
    .post(controller.createCoupon);

  router.route('/coupons/:couponId')
    .get(controller.getCouponById)
    .put(controller.updateCoupon)
    .delete(controller.deleteCoupon);

  // Storefront Customers
  router.get('/customers', controller.adminListCustomers);
  router.get('/customers/:customerId', controller.adminDetailCustomer);
  router.post('/customers/:customerId/convert-to-crm', controller.convertToCrm);

  // Smart Rules
  router.route('/rules')
    .get(controller.getAllRules)
    .post(controller.createRule);

  router.post('/rules/preview', controller.previewRule);

  router.route('/rules/:ruleId')
    .get(controller.getRuleById)
    .put(controller.updateRule)
    .delete(controller.deleteRule);

  router.post('/rules/:ruleId/execute', controller.executeRule);
  router.post('/rules/:ruleId/clear-cache', controller.clearRuleCache);
  router.delete('/rules/:ruleId/cache', controller.clearRuleCache);

  return router;
}
