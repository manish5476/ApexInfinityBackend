import { IAnalyticsRepository } from '../../domain/ports/IAnalyticsRepository';
import {
  FinancialMetricTrend,
  GrossProfitData,
  ChartSeriesData,
  CustomerFeedEvent,
  AnalyticsDashboardOverview,
} from '../../domain/entities/Analytics';

export class AnalyticsUseCases {
  constructor(private readonly repo: IAnalyticsRepository) {}

  // ── Executive & Comparison ────────────────────────────────────────────────
  async getDashboardOverview(orgId: string): Promise<AnalyticsDashboardOverview> {
    return this.repo.getDashboardOverview(orgId);
  }

  async getBranchComparison(orgId: string): Promise<Record<string, unknown>> {
    return this.repo.getBranchComparison(orgId);
  }

  // ── Financial Intelligence ────────────────────────────────────────────────
  async getFinancialTrend(orgId: string, year?: number): Promise<FinancialMetricTrend[]> {
    return this.repo.getFinancialTrend(orgId, year);
  }

  async getGrossProfitTrend(orgId: string, year?: number): Promise<GrossProfitData[]> {
    return this.repo.getGrossProfitTrend(orgId, year);
  }

  async getYoYGrowth(orgId: string, year?: number): Promise<Record<string, unknown>> {
    return this.repo.getYoYGrowth(orgId, year);
  }

  async getPurchaseVsSales(orgId: string, year?: number): Promise<Record<string, unknown>> {
    return this.repo.getPurchaseVsSales(orgId, year);
  }

  async getSalesReturnRate(orgId: string, year?: number): Promise<Record<string, unknown>> {
    return this.repo.getSalesReturnRate(orgId, year);
  }

  async getEmiAnalytics(orgId: string): Promise<Record<string, unknown>> {
    return this.repo.getEmiPortfolioStats(orgId);
  }

  // ── Customer Intelligence ─────────────────────────────────────────────────
  async getCustomerOverview(orgId: string): Promise<Record<string, unknown>> {
    return this.repo.getCustomerOverview(orgId);
  }

  async getCustomerFinancialAnalytics(orgId: string): Promise<Record<string, unknown>> {
    return this.repo.getCustomerFinancialAnalytics(orgId);
  }

  async getCustomerPaymentBehavior(orgId: string): Promise<Record<string, unknown>> {
    return this.repo.getCustomerPaymentBehavior(orgId);
  }

  async getCustomerLifetimeValue(orgId: string): Promise<Record<string, unknown>> {
    return this.repo.getCustomerLifetimeValue(orgId);
  }

  async getCustomerSegmentation(orgId: string): Promise<Record<string, unknown>> {
    return this.repo.getCustomerSegmentation(orgId);
  }

  async getCustomerGeospatial(orgId: string): Promise<Record<string, unknown>> {
    return this.repo.getCustomerGeospatial(orgId);
  }

  async getCustomerFeed(orgId: string, customerId: string): Promise<CustomerFeedEvent[]> {
    return this.repo.getCustomerFeed(orgId, customerId);
  }

  // ── Charts & Visualizations ───────────────────────────────────────────────
  async getSalesDistribution(orgId: string, groupBy?: string, startDate?: string, endDate?: string): Promise<ChartSeriesData> {
    return this.repo.getSalesDistribution(orgId, groupBy, startDate, endDate);
  }

  async getPaymentMethodBreakdown(orgId: string, startDate?: string, endDate?: string): Promise<ChartSeriesData> {
    return this.repo.getPaymentMethodBreakdown(orgId, startDate, endDate);
  }

  async getBranchPerformanceRadar(orgId: string, startDate?: string, endDate?: string): Promise<Record<string, unknown>> {
    return this.repo.getBranchPerformanceRadar(orgId, startDate, endDate);
  }

  async getTopPerformers(orgId: string, type?: string, limit?: number, startDate?: string, endDate?: string): Promise<Array<Record<string, unknown>>> {
    return this.repo.getTopPerformers(orgId, type, limit, startDate, endDate);
  }

  async getOrderFunnel(orgId: string, startDate?: string, endDate?: string): Promise<Record<string, unknown>> {
    return this.repo.getOrderFunnel(orgId, startDate, endDate);
  }

  async getAOVTrend(orgId: string, year?: number): Promise<Record<string, unknown>> {
    return this.repo.getAOVTrend(orgId, year);
  }

  async getHeatmap(orgId: string, branchId?: string, days?: number): Promise<Array<{ day: number; hour: number; count: number }>> {
    return this.repo.getHeatmap(orgId, branchId, days);
  }

  async getCustomerAcquisition(orgId: string, year?: number): Promise<ChartSeriesData> {
    return this.repo.getCustomerAcquisition(orgId, year);
  }

  async getCustomerOutstanding(orgId: string, limit?: number): Promise<Array<Record<string, unknown>>> {
    return this.repo.getCustomerOutstanding(orgId, limit);
  }

  async getInventoryHealth(orgId: string, branchId?: string): Promise<Record<string, unknown>> {
    return this.repo.getInventoryHealth(orgId, branchId);
  }

  async getEmiPortfolioStats(orgId: string): Promise<Record<string, unknown>> {
    return this.repo.getEmiPortfolioStats(orgId);
  }

  async getAttendanceKpis(orgId: string, branchId?: string, days?: number): Promise<Record<string, unknown>> {
    return this.repo.getAttendanceKpis(orgId, branchId, days);
  }

  async getLeaveUtilization(orgId: string, financialYear?: string): Promise<Record<string, unknown>> {
    return this.repo.getLeaveUtilization(orgId, financialYear);
  }

  // ── Operational, Security & Health ────────────────────────────────────────
  async getOperationalMetrics(orgId: string): Promise<Record<string, unknown>> {
    return this.repo.getOperationalMetrics(orgId);
  }

  async getStaffPerformance(orgId: string): Promise<Record<string, unknown>> {
    return this.repo.getStaffPerformance(orgId);
  }

  async getPeakBusinessHours(orgId: string): Promise<Record<string, unknown>> {
    return this.repo.getPeakBusinessHours(orgId);
  }

  async getForecast(orgId: string): Promise<Record<string, unknown>> {
    return this.repo.getForecast(orgId);
  }

  async getRealTimeMonitoring(orgId: string): Promise<Record<string, unknown>> {
    return this.repo.getRealTimeMonitoring(orgId);
  }

  async getSecurityAuditLog(orgId: string): Promise<Record<string, unknown>> {
    return this.repo.getSecurityAuditLog(orgId);
  }

  async getComplianceDashboard(orgId: string): Promise<Record<string, unknown>> {
    return this.repo.getComplianceDashboard(orgId);
  }

  async getDataHealth(orgId: string): Promise<Record<string, unknown>> {
    return this.repo.getDataHealth(orgId);
  }
}
