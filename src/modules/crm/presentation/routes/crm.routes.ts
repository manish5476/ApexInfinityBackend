import { Router } from 'express';
import { CrmController } from '../controllers/crm.controller';
import { ITokenService } from '../../../../infrastructure/security/ITokenService';
import { createAuthMiddleware } from '../../../../middleware/auth.middleware';

export function createCustomerRoutes(
  controller: CrmController,
  tokenService: ITokenService
): Router {
  const router = Router();
  const authGuard = createAuthMiddleware(tokenService);

  router.use(authGuard);

  // Static / search routes (before /:id)
  router.get('/search', controller.searchCustomers);
  router.get('/check-duplicate', controller.checkDuplicate);
  router.post('/bulk-update', controller.bulkUpdateCustomers);
  router.post('/bulk-customer', controller.createBulkCustomer);

  // Specialized /:id sub-routes
  router.patch('/:id/upload', controller.uploadCustomerPhoto);
  router.get('/:id/guaranteed-customers', controller.getGuaranteedCustomers);
  router.get('/:id/with-guarantors', controller.getCustomerWithGuarantors);
  router.patch('/:id/credit-limit', controller.updateCreditLimit);
  router.patch('/:id/restore', controller.restoreCustomer);
  router.post('/:id/guarantors', controller.addGuarantor);
  router.delete('/:id/guarantors/:guarantorId', controller.removeGuarantor);

  // Core CRUD
  router.get('/', controller.listCustomers);
  router.post('/', controller.createCustomer);
  router.get('/:id', controller.getCustomerById);
  router.patch('/:id', controller.updateCustomer);
  router.delete('/:id', controller.deleteCustomer);

  return router;
}

export function createCrmRoutes(
  controller: CrmController,
  tokenService: ITokenService
): Router {
  const router = Router();
  const authGuard = createAuthMiddleware(tokenService);

  router.use(authGuard);

  // Mount customer sub-routes under /crm/customers
  router.use('/customers', createCustomerRoutes(controller, tokenService));

  // Leads
  router.post('/leads', controller.createLead);
  router.post('/leads/:leadId/convert', controller.convertLead);

  // Opportunities
  router.get('/opportunities', controller.listOpportunities);
  router.post('/opportunities', controller.createOpportunity);
  router.patch('/opportunities/:id/stage', controller.updateOpportunityStage);

  return router;
}

