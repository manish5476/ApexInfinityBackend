import express, { Express } from 'express';
import { ApplicationContainer } from './composition/composition-root';
import { MiddlewarePipeline } from '../middleware/pipeline';

export function createApp(container: ApplicationContainer): Express {
  const app = express();

  // 1. Pre-routing middleware pipeline
  MiddlewarePipeline.configurePreRouting(app, {
    config: container.deps.config,
    logger: container.deps.logger,
  });

  // 2. Health endpoints (root level + api/v1 level for container probes)
  app.use('/health', container.modules.health.routes);
  app.use('/api/v1/health', container.modules.health.routes);

  // 3. Domain module routes
  const apiRouter = express.Router();
  apiRouter.use('/auth', container.modules.auth.routes);
  apiRouter.use('/users', container.modules.auth.routes);
  apiRouter.use('/organizations', container.modules.organization.routes);
  apiRouter.use('/organization', container.modules.organization.routes);
  apiRouter.use('/branches', container.modules.organization.branchRoutes);
  apiRouter.use('/hrms', container.modules.hrms.routes);
  apiRouter.use('/crm', container.modules.crm.routes);
  apiRouter.use('/customers', container.modules.crm.customerRoutes);
  apiRouter.use('/inventory', container.modules.inventory.routes);
  apiRouter.use('/products', container.modules.inventory.productRoutes);
  apiRouter.use('/stock', container.modules.inventory.stockRoutes);
  apiRouter.use('/purchases', container.modules.inventory.purchaseRoutes);
  apiRouter.use('/sales', container.modules.inventory.salesRoutes);
  apiRouter.use('/accounting', container.modules.accounting.routes);
  apiRouter.use('/invoices', container.modules.accounting.invoiceRoutes);
  apiRouter.use('/payments', container.modules.accounting.paymentRoutes);
  apiRouter.use('/accounts', container.modules.accounting.accountRoutes);
  apiRouter.use('/ledgers', container.modules.accounting.ledgerRoutes);
  apiRouter.use('/admin/storefront', container.modules.storefront.adminRoutes);
  apiRouter.use('/store', container.modules.storefront.publicRoutes);
  apiRouter.use('/notifications', container.modules.notification.routes);
  apiRouter.use('/webhooks', container.modules.webhook.routes);

  app.use('/api/v1', apiRouter);

  // 4. Post-routing middleware pipeline (404 and error handling)
  MiddlewarePipeline.configurePostRouting(app, {
    config: container.deps.config,
    logger: container.deps.logger,
  });

  return app;
}
