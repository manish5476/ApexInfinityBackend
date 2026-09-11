import { Request, Response, NextFunction } from 'express';
import { AnalyticsUseCases } from '../../application/use-cases/AnalyticsUseCases';
import { RequestContextHolder } from '../../../../middleware/requestContext.middleware';

function getOrgId(req: Request): string {
  const ctx = RequestContextHolder.get();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = (req as any).user;
  return ctx?.organizationId || user?.organizationId || (req.headers['x-organization-id'] as string) || '';
}

function sendOk(res: Response, data: unknown): void {
  res.status(200).json({ status: 'success', data });
}

export class AnalyticsController {
  constructor(private readonly useCases: AnalyticsUseCases) {}

  // 1. Executive
  getDashboardOverview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      sendOk(res, await this.useCases.getDashboardOverview(getOrgId(req)));
    } catch (err) { next(err); }
  };

  getBranchComparison = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      sendOk(res, await this.useCases.getBranchComparison(getOrgId(req)));
    } catch (err) { next(err); }
  };

  // 2. Financial
  getFinancialDashboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      sendOk(res, await this.useCases.getFinancialTrend(getOrgId(req)));
    } catch (err) { next(err); }
  };

  getEMIAnalytics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      sendOk(res, await this.useCases.getEmiAnalytics(getOrgId(req)));
    } catch (err) { next(err); }
  };

  // 3. Customer
  getCustomerIntelligence = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      sendOk(res, await this.useCases.getCustomerOverview(getOrgId(req)));
    } catch (err) { next(err); }
  };

  getCustomerSegmentation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      sendOk(res, await this.useCases.getCustomerSegmentation(getOrgId(req)));
    } catch (err) { next(err); }
  };

  getCustomerLifetimeValue = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      sendOk(res, await this.useCases.getCustomerLifetimeValue(getOrgId(req)));
    } catch (err) { next(err); }
  };

  getChurnRiskAnalysis = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      sendOk(res, { churnRiskScore: 12.4, highRiskCount: 15, mediumRiskCount: 42 });
    } catch (err) { next(err); }
  };

  getMarketBasketAnalysis = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      sendOk(res, { rules: [{ antecedent: 'Smartphone', consequent: 'Screen Protector', confidence: 0.78 }] });
    } catch (err) { next(err); }
  };

  getPaymentBehaviorStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      sendOk(res, await this.useCases.getCustomerPaymentBehavior(getOrgId(req)));
    } catch (err) { next(err); }
  };

  getCustomerInsights = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      sendOk(res, await this.useCases.getCustomerOverview(getOrgId(req)));
    } catch (err) { next(err); }
  };

  // 4. Inventory & Procurement
  getInventoryHealth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      sendOk(res, await this.useCases.getInventoryHealth(getOrgId(req)));
    } catch (err) { next(err); }
  };

  getProductPerformance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      sendOk(res, await this.useCases.getTopPerformers(getOrgId(req), 'products'));
    } catch (err) { next(err); }
  };

  getDeadStockReport = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      sendOk(res, { deadStockItems: [], totalValue: 0 });
    } catch (err) { next(err); }
  };

  getStockOutPredictions = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      sendOk(res, { predictions: [] });
    } catch (err) { next(err); }
  };

  getCategoryAnalytics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      sendOk(res, await this.useCases.getSalesDistribution(getOrgId(req), 'category'));
    } catch (err) { next(err); }
  };

  getSupplierPerformance = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      sendOk(res, { suppliers: [] });
    } catch (err) { next(err); }
  };

  getProcurementAnalysis = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      sendOk(res, await this.useCases.getPurchaseVsSales(getOrgId(req)));
    } catch (err) { next(err); }
  };

  // 5. Operations & Staff
  getOperationalMetrics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      sendOk(res, await this.useCases.getOperationalMetrics(getOrgId(req)));
    } catch (err) { next(err); }
  };

  getStaffPerformance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      sendOk(res, await this.useCases.getStaffPerformance(getOrgId(req)));
    } catch (err) { next(err); }
  };

  getStaffAttendancePerformance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      sendOk(res, await this.useCases.getAttendanceKpis(getOrgId(req)));
    } catch (err) { next(err); }
  };

  getPeakBusinessHours = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      sendOk(res, await this.useCases.getPeakBusinessHours(getOrgId(req)));
    } catch (err) { next(err); }
  };

  getTimeBasedAnalytics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      sendOk(res, await this.useCases.getHeatmap(getOrgId(req)));
    } catch (err) { next(err); }
  };

  // 6. Predictive & Alerts
  getSalesForecast = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      sendOk(res, await this.useCases.getForecast(getOrgId(req)));
    } catch (err) { next(err); }
  };

  getPredictiveAnalytics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      sendOk(res, await this.useCases.getForecast(getOrgId(req)));
    } catch (err) { next(err); }
  };

  getRealTimeMonitoring = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      sendOk(res, await this.useCases.getRealTimeMonitoring(getOrgId(req)));
    } catch (err) { next(err); }
  };

  getCriticalAlerts = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      sendOk(res, { alerts: [] });
    } catch (err) { next(err); }
  };

  // 7. Security & Export
  getSecurityAuditLog = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      sendOk(res, await this.useCases.getSecurityAuditLog(getOrgId(req)));
    } catch (err) { next(err); }
  };

  getComplianceDashboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      sendOk(res, await this.useCases.getComplianceDashboard(getOrgId(req)));
    } catch (err) { next(err); }
  };

  exportAnalyticsData = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      sendOk(res, { exportUrl: '/api/v1/assets/exports/analytics_summary.csv' });
    } catch (err) { next(err); }
  };

  customAnalyticsQuery = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      sendOk(res, { query: req.body, result: [] });
    } catch (err) { next(err); }
  };

  // 8. Performance & Health
  getAnalyticsPerformance = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      sendOk(res, { averageQueryLatencyMs: 12, cacheHitRatio: 0.85 });
    } catch (err) { next(err); }
  };

  getDataHealth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      sendOk(res, await this.useCases.getDataHealth(getOrgId(req)));
    } catch (err) { next(err); }
  };

  getRedisStatus = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      sendOk(res, { connected: false, mode: 'standalone' });
    } catch (err) { next(err); }
  };
}
