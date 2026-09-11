import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller';

export function createAnalyticsRouter(ctrl: AnalyticsController): Router {
  const router = Router();

  // 1. Executive & Comparison
  router.get('/dashboard', ctrl.getDashboardOverview);
  router.get('/branch-comparison', ctrl.getBranchComparison);

  // 2. Financial Intelligence
  router.get('/financials', ctrl.getFinancialDashboard);
  router.get('/cash-flow', ctrl.getFinancialDashboard);
  router.get('/emi-analytics', ctrl.getEMIAnalytics);

  // 3. Customer Intelligence
  router.get('/customer-intelligence', ctrl.getCustomerIntelligence);
  router.get('/customer-segmentation', ctrl.getCustomerSegmentation);
  router.get('/customer-ltv', ctrl.getCustomerLifetimeValue);
  router.get('/churn-risk', ctrl.getChurnRiskAnalysis);
  router.get('/market-basket', ctrl.getMarketBasketAnalysis);
  router.get('/payment-behavior', ctrl.getPaymentBehaviorStats);
  router.get('/customer-insights', ctrl.getCustomerInsights);

  // 4. Inventory & Procurement
  router.get('/inventory-health', ctrl.getInventoryHealth);
  router.get('/product-performance', ctrl.getProductPerformance);
  router.get('/dead-stock', ctrl.getDeadStockReport);
  router.get('/stock-predictions', ctrl.getStockOutPredictions);
  router.get('/category-performance', ctrl.getCategoryAnalytics);
  router.get('/supplier-performance', ctrl.getSupplierPerformance);
  router.get('/procurement', ctrl.getProcurementAnalysis);

  // 5. Operational & Staff
  router.get('/operational-metrics', ctrl.getOperationalMetrics);
  router.get('/staff-performance', ctrl.getStaffPerformance);
  router.get('/staff-attendance-performance', ctrl.getStaffAttendancePerformance);
  router.get('/peak-hours', ctrl.getPeakBusinessHours);
  router.get('/time-analytics', ctrl.getTimeBasedAnalytics);

  // 6. Predictive & Alerts
  router.get('/forecast', ctrl.getSalesForecast);
  router.get('/predictive-analytics', ctrl.getPredictiveAnalytics);
  router.get('/alerts/realtime', ctrl.getRealTimeMonitoring);
  router.get('/critical-alerts', ctrl.getCriticalAlerts);

  // 7. Security, Compliance & Export
  router.get('/security-audit', ctrl.getSecurityAuditLog);
  router.get('/compliance-dashboard', ctrl.getComplianceDashboard);
  router.get('/export', ctrl.exportAnalyticsData);
  router.post('/query', ctrl.customAnalyticsQuery);

  // 8. Infrastructure & Health
  router.get('/performance', ctrl.getAnalyticsPerformance);
  router.get('/health/data', ctrl.getDataHealth);
  router.get('/redis-status', ctrl.getRedisStatus);

  return router;
}
