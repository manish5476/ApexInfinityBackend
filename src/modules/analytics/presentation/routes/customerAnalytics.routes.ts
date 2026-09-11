import { Router } from 'express';
import { CustomerAnalyticsController } from '../controllers/customerAnalytics.controller';

export function createCustomerAnalyticsRouter(ctrl: CustomerAnalyticsController): Router {
  const router = Router();

  router.get('/overview', ctrl.getCustomerOverview);
  router.get('/financials', ctrl.getCustomerFinancialAnalytics);
  router.get('/payment-behavior', ctrl.getCustomerPaymentBehavior);
  router.get('/ltv', ctrl.getCustomerLifetimeValue);
  router.get('/segmentation', ctrl.getCustomerSegmentation);
  router.get('/geospatial', ctrl.getCustomerGeospatial);
  router.get('/realtime', ctrl.getRealTimeDashboard);
  router.get('/emi', ctrl.getCustomerEMIAnalytics);
  router.get('/export/financials', ctrl.exportFinancialsToCSV);

  return router;
}
