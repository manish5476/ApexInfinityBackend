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
  apiRouter.use('/users', container.modules.auth.userRoutes);
  apiRouter.use('/roles', container.modules.auth.roleRoutes);
  apiRouter.use('/sessions', container.modules.auth.sessionRoutes);
  apiRouter.use('/organizations', container.modules.organization.routes);
  apiRouter.use('/organization', container.modules.organization.routes);
  apiRouter.use('/neworganization', container.modules.organization.extrasRoutes);
  apiRouter.use('/ownership', container.modules.organization.ownershipRoutes);
  apiRouter.use('/branches', container.modules.organization.branchRoutes);
  apiRouter.use('/hrms', container.modules.hrms.routes);
  apiRouter.use('/crm', container.modules.crm.routes);
  apiRouter.use('/customers', container.modules.crm.customerRoutes);
  apiRouter.use('/suppliers', container.modules.crm.supplierRoutes);
  apiRouter.use('/inventory', container.modules.inventory.routes);
  apiRouter.use('/products', container.modules.inventory.productRoutes);
  apiRouter.use('/stock', container.modules.inventory.stockRoutes);
  apiRouter.use('/purchases', container.modules.inventory.purchaseRoutes);
  apiRouter.use('/sales', container.modules.inventory.salesRoutes);
  apiRouter.use('/sales-returns', container.modules.inventory.salesReturnRoutes);
  apiRouter.use('/sales/returns', container.modules.inventory.salesReturnRoutes);
  apiRouter.use('/accounting', container.modules.accounting.routes);
  apiRouter.use('/invoices/pdf', container.modules.accounting.invoicePdfRoutes);
  apiRouter.use('/invoices', container.modules.accounting.invoiceRoutes);
  apiRouter.use('/payments', container.modules.accounting.paymentRoutes);
  apiRouter.use('/accounts', container.modules.accounting.accountRoutes);
  apiRouter.use('/ledgers', container.modules.accounting.ledgerRoutes);
  apiRouter.use('/emi', container.modules.accounting.emiRoutes);
  apiRouter.use('/statements', container.modules.accounting.statementRoutes);
  apiRouter.use('/reconciliation', container.modules.accounting.reconciliationRoutes);
  apiRouter.use('/transactions', container.modules.accounting.transactionRoutes);
  apiRouter.use('/partytransactions', container.modules.accounting.partyTransactionRoutes);
  apiRouter.use('/admin/storefront/smart-rules', container.modules.storefront.smartRuleRoutes);
  apiRouter.use('/admin/storefront/forms', container.modules.storefront.formRoutes);
  apiRouter.use('/admin/storefront', container.modules.storefront.adminRoutes);
  apiRouter.use('/store', container.modules.storefront.publicRoutes);
  apiRouter.use('/delivery-agent', container.modules.storefront.deliveryRoutes);
  apiRouter.use('/platform-delivery', container.modules.storefront.platformDeliveryRoutes);
  apiRouter.use('/notifications', container.modules.notification.routes);
  apiRouter.use('/announcements', container.modules.notification.announcementRoutes);
  apiRouter.use('/webhooks', container.modules.webhook.routes);
  apiRouter.use('/master', container.modules.master.masterRoutes);
  apiRouter.use('/master-list', container.modules.master.masterListRoutes);
  apiRouter.use('/master-types', container.modules.master.masterTypeRoutes);
  apiRouter.use('/dropdowns', container.modules.master.dropdownRoutes);
  apiRouter.use('/notes', container.modules.collaboration.noteRoutes);
  apiRouter.use('/tasks', container.modules.collaboration.noteRoutes);
  apiRouter.use('/meetings', container.modules.collaboration.noteRoutes);
  apiRouter.use('/field-service/work-assignments', container.modules.fieldService.router);
  apiRouter.use('/assets', container.modules.mediaAssets.router);
  apiRouter.use('/logistics', container.modules.logistics.router);
  apiRouter.use('/admin', container.modules.adminPlatform.adminAnalyticsRoutes);
  apiRouter.use('/admin/platform', container.modules.adminPlatform.platformRouter);
  apiRouter.use('/internal/platform', container.modules.adminPlatform.internalRouter);
  apiRouter.use('/analytics', container.modules.analytics.analyticsRouter);
  apiRouter.use('/charts', container.modules.analytics.chartRouter);
  apiRouter.use('/customer-analytics', container.modules.analytics.customerAnalyticsRouter);
  apiRouter.use('/feed', container.modules.analytics.feedRouter);
  apiRouter.use('/ai-agent', container.modules.aiAgent.aiAgentRouter);
  apiRouter.use('/chat', container.modules.aiAgent.chatRouter);
  apiRouter.use('/search', container.modules.search.routes);
  apiRouter.use('/cron', container.modules.systemOps.cronRoutes);
  apiRouter.use('/logs', container.modules.systemOps.logRoutes);
  apiRouter.use('/dashboard', container.modules.systemOps.dashboardRoutes);

  app.use('/api/v1', apiRouter);

  // 4. Post-routing middleware pipeline (404 and error handling)
  MiddlewarePipeline.configurePostRouting(app, {
    config: container.deps.config,
    logger: container.deps.logger,
  });

  return app;
}
