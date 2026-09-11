import { Router } from 'express';
import { ChartController } from '../controllers/chart.controller';

export function createChartRouter(ctrl: ChartController): Router {
  const router = Router();

  // Financial & Sales
  router.get('/financial-trend', ctrl.getFinancialTrend);
  router.get('/gross-profit', ctrl.getGrossProfitTrend);
  router.get('/yoy-growth', ctrl.getYoYGrowth);
  router.get('/purchase-vs-sales', ctrl.getPurchaseVsSales);
  router.get('/return-rate', ctrl.getSalesReturnRate);

  // Distribution & Segmentation
  router.get('/sales-distribution', ctrl.getSalesDistribution);
  router.get('/payment-methods', ctrl.getPaymentMethodBreakdown);

  // Branch & Performance
  router.get('/branch-radar', ctrl.getBranchPerformanceRadar);
  router.get('/top-performers', ctrl.getTopPerformers);

  // Orders & Pipeline
  router.get('/order-funnel', ctrl.getOrderFunnel);
  router.get('/aov-trend', ctrl.getAOVTrend);
  router.get('/heatmap', ctrl.getHeatmap);

  // Customers
  router.get('/customer-acquisition', ctrl.getCustomerAcquisition);
  router.get('/customer-outstanding', ctrl.getCustomerOutstanding);

  // Inventory & EMI
  router.get('/inventory-health', ctrl.getInventoryHealth);
  router.get('/emi-portfolio', ctrl.getEmiPortfolioStats);

  // HRMS
  router.get('/attendance-kpis', ctrl.getAttendanceKpis);
  router.get('/leave-utilization', ctrl.getLeaveUtilization);

  return router;
}
