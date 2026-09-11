import {
  FinancialMetricTrend,
  GrossProfitData,
  ChartSeriesData,
  CustomerFeedEvent,
  AnalyticsDashboardOverview,
} from '../entities/Analytics';

export interface IAnalyticsRepository {
  getDashboardOverview(orgId: string): Promise<AnalyticsDashboardOverview>;
  getBranchComparison(orgId: string): Promise<Record<string, unknown>>;
  getFinancialTrend(orgId: string, year?: number): Promise<FinancialMetricTrend[]>;
  getGrossProfitTrend(orgId: string, year?: number): Promise<GrossProfitData[]>;
  getYoYGrowth(orgId: string, year?: number): Promise<Record<string, unknown>>;
  getPurchaseVsSales(orgId: string, year?: number): Promise<Record<string, unknown>>;
  getSalesReturnRate(orgId: string, year?: number): Promise<Record<string, unknown>>;
  getSalesDistribution(orgId: string, groupBy?: string, startDate?: string, endDate?: string): Promise<ChartSeriesData>;
  getPaymentMethodBreakdown(orgId: string, startDate?: string, endDate?: string): Promise<ChartSeriesData>;
  getBranchPerformanceRadar(orgId: string, startDate?: string, endDate?: string): Promise<Record<string, unknown>>;
  getTopPerformers(orgId: string, type?: string, limit?: number, startDate?: string, endDate?: string): Promise<Array<Record<string, unknown>>>;
  getOrderFunnel(orgId: string, startDate?: string, endDate?: string): Promise<Record<string, unknown>>;
  getAOVTrend(orgId: string, year?: number): Promise<Record<string, unknown>>;
  getHeatmap(orgId: string, branchId?: string, days?: number): Promise<Array<{ day: number; hour: number; count: number }>>;
  getCustomerAcquisition(orgId: string, year?: number): Promise<ChartSeriesData>;
  getCustomerOutstanding(orgId: string, limit?: number): Promise<Array<Record<string, unknown>>>;
  getInventoryHealth(orgId: string, branchId?: string): Promise<Record<string, unknown>>;
  getEmiPortfolioStats(orgId: string): Promise<Record<string, unknown>>;
  getAttendanceKpis(orgId: string, branchId?: string, days?: number): Promise<Record<string, unknown>>;
  getLeaveUtilization(orgId: string, financialYear?: string): Promise<Record<string, unknown>>;
  getCustomerOverview(orgId: string): Promise<Record<string, unknown>>;
  getCustomerFinancialAnalytics(orgId: string): Promise<Record<string, unknown>>;
  getCustomerPaymentBehavior(orgId: string): Promise<Record<string, unknown>>;
  getCustomerLifetimeValue(orgId: string): Promise<Record<string, unknown>>;
  getCustomerSegmentation(orgId: string): Promise<Record<string, unknown>>;
  getCustomerGeospatial(orgId: string): Promise<Record<string, unknown>>;
  getCustomerFeed(orgId: string, customerId: string): Promise<CustomerFeedEvent[]>;
  getOperationalMetrics(orgId: string): Promise<Record<string, unknown>>;
  getStaffPerformance(orgId: string): Promise<Record<string, unknown>>;
  getPeakBusinessHours(orgId: string): Promise<Record<string, unknown>>;
  getForecast(orgId: string): Promise<Record<string, unknown>>;
  getRealTimeMonitoring(orgId: string): Promise<Record<string, unknown>>;
  getSecurityAuditLog(orgId: string): Promise<Record<string, unknown>>;
  getComplianceDashboard(orgId: string): Promise<Record<string, unknown>>;
  getDataHealth(orgId: string): Promise<Record<string, unknown>>;
}
