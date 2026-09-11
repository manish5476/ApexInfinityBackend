import {
  FinancialMetricTrend,
  GrossProfitData,
  ChartSeriesData,
  CustomerFeedEvent,
  AnalyticsDashboardOverview,
} from '../../domain/entities/Analytics';
import { IAnalyticsRepository } from '../../domain/ports/IAnalyticsRepository';

export class InMemoryAnalyticsRepository implements IAnalyticsRepository {
  async getDashboardOverview(_orgId: string): Promise<AnalyticsDashboardOverview> {
    return {
      totalRevenue: 15420000,
      totalOrders: 1420,
      activeCustomers: 890,
      inventoryValuation: 4800000,
      outstandingReceivables: 620000,
      revenueGrowthPercentage: 14.8,
      lastUpdated: new Date().toISOString(),
    };
  }

  async getBranchComparison(_orgId: string): Promise<Record<string, unknown>> {
    return {
      branches: [
        { branchId: 'b1', name: 'Main Branch', revenue: 8500000, orders: 820 },
        { branchId: 'b2', name: 'Sub Branch', revenue: 6920000, orders: 600 },
      ],
    };
  }

  async getFinancialTrend(_orgId: string, _year?: number): Promise<FinancialMetricTrend[]> {
    return [
      { period: '2024-01', income: 1200000, expense: 800000, netProfit: 400000 },
      { period: '2024-02', income: 1400000, expense: 850000, netProfit: 550000 },
      { period: '2024-03', income: 1650000, expense: 950000, netProfit: 700000 },
    ];
  }

  async getGrossProfitTrend(_orgId: string, _year?: number): Promise<GrossProfitData[]> {
    return [
      { period: '2024-01', revenue: 1200000, cogs: 720000, grossProfit: 480000, marginPercentage: 40 },
      { period: '2024-02', revenue: 1400000, cogs: 812000, grossProfit: 588000, marginPercentage: 42 },
    ];
  }

  async getYoYGrowth(_orgId: string, _year?: number): Promise<Record<string, unknown>> {
    return { currentYearTotal: 15420000, previousYearTotal: 13200000, growthRate: 16.82 };
  }

  async getPurchaseVsSales(_orgId: string, _year?: number): Promise<Record<string, unknown>> {
    return { salesTotal: 15420000, purchaseTotal: 9800000, netCashImpact: 5620000 };
  }

  async getSalesReturnRate(_orgId: string, _year?: number): Promise<Record<string, unknown>> {
    return { returnRatePercentage: 2.14, totalReturns: 32, returnedValue: 330000 };
  }

  async getSalesDistribution(_orgId: string, _groupBy?: string): Promise<ChartSeriesData> {
    return {
      labels: ['Smartphones', 'Laptops', 'Audio', 'Accessories'],
      datasets: [{ label: 'Sales Distribution', data: [45, 30, 15, 10] }],
    };
  }

  async getPaymentMethodBreakdown(_orgId: string): Promise<ChartSeriesData> {
    return {
      labels: ['UPI', 'Credit Card', 'Cash', 'EMI', 'Net Banking'],
      datasets: [{ label: 'Payment Methods', data: [50, 25, 10, 10, 5] }],
    };
  }

  async getBranchPerformanceRadar(_orgId: string): Promise<Record<string, unknown>> {
    return {
      metrics: ['Sales', 'Customer Satisfaction', 'Order Speed', 'Inventory Turnover', 'Profit Margin'],
      scores: [88, 92, 85, 78, 90],
    };
  }

  async getTopPerformers(_orgId: string, type = 'products', limit = 5): Promise<Array<Record<string, unknown>>> {
    return [
      { id: '1', name: `Top ${type} A`, value: 1200000, rank: 1 },
      { id: '2', name: `Top ${type} B`, value: 950000, rank: 2 },
    ].slice(0, limit);
  }

  async getOrderFunnel(_orgId: string): Promise<Record<string, unknown>> {
    return { created: 1000, active: 850, partial: 100, paid: 750 };
  }

  async getAOVTrend(_orgId: string, _year?: number): Promise<Record<string, unknown>> {
    return { averageOrderValue: 10859.15, orderCount: 1420 };
  }

  async getHeatmap(_orgId: string, _branchId?: string, _days = 30): Promise<Array<{ day: number; hour: number; count: number }>> {
    return [
      { day: 1, hour: 11, count: 45 },
      { day: 1, hour: 15, count: 68 },
      { day: 5, hour: 18, count: 92 },
    ];
  }

  async getCustomerAcquisition(_orgId: string, _year?: number): Promise<ChartSeriesData> {
    return {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [{ label: 'New Customers', data: [45, 52, 60, 75, 82, 90] }],
    };
  }

  async getCustomerOutstanding(_orgId: string, limit = 10): Promise<Array<Record<string, unknown>>> {
    return [
      { customerId: 'c1', name: 'Alpha Corp', outstanding: 150000, creditLimit: 200000 },
      { customerId: 'c2', name: 'Beta Ltd', outstanding: 85000, creditLimit: 100000 },
    ].slice(0, limit);
  }

  async getInventoryHealth(_orgId: string, _branchId?: string): Promise<Record<string, unknown>> {
    return { healthyCount: 350, lowStockCount: 42, criticalCount: 8, outOfStockCount: 3 };
  }

  async getEmiPortfolioStats(_orgId: string): Promise<Record<string, unknown>> {
    return { activePlans: 120, totalPrincipal: 4500000, overdueCount: 6, overdueAmount: 95000 };
  }

  async getAttendanceKpis(_orgId: string, _branchId?: string, _days = 30): Promise<Record<string, unknown>> {
    return { averagePresentRate: 94.2, averageLateRate: 3.8, averageAbsentRate: 2.0 };
  }

  async getLeaveUtilization(_orgId: string, _financialYear?: string): Promise<Record<string, unknown>> {
    return { totalEntitled: 480, totalConsumed: 210, utilizationRate: 43.75 };
  }

  async getCustomerOverview(_orgId: string): Promise<Record<string, unknown>> {
    return { totalCustomers: 890, activeCustomers: 720, churnRate: 1.8 };
  }

  async getCustomerFinancialAnalytics(_orgId: string): Promise<Record<string, unknown>> {
    return { totalSpend: 15420000, avgSpendPerCustomer: 17325.84, topSpenderSegment: 'High Value' };
  }

  async getCustomerPaymentBehavior(_orgId: string): Promise<Record<string, unknown>> {
    return { onTimePercentage: 88.5, latePercentage: 9.5, defaultPercentage: 2.0 };
  }

  async getCustomerLifetimeValue(_orgId: string): Promise<Record<string, unknown>> {
    return { averageLTV: 45000, highestLTV: 480000, segmentLTV: { VIP: 120000, Regular: 35000 } };
  }

  async getCustomerSegmentation(_orgId: string): Promise<Record<string, unknown>> {
    return {
      champions: 120,
      loyal: 250,
      potentialLoyalists: 180,
      atRisk: 45,
      lost: 20,
    };
  }

  async getCustomerGeospatial(_orgId: string): Promise<Record<string, unknown>> {
    return {
      regions: [
        { state: 'Maharashtra', count: 520 },
        { state: 'Gujarat', count: 210 },
        { state: 'Karnataka', count: 160 },
      ],
    };
  }

  async getCustomerFeed(orgId: string, customerId: string): Promise<CustomerFeedEvent[]> {
    return [
      {
        id: 'f1',
        customerId,
        organizationId: orgId,
        type: 'sale',
        title: 'New Order Placed',
        description: 'Invoice #INV-2024-001 created for INR 45,000',
        amount: 45000,
        referenceId: 'INV-2024-001',
        timestamp: new Date(),
      },
      {
        id: 'f2',
        customerId,
        organizationId: orgId,
        type: 'payment',
        title: 'Payment Received',
        description: 'Payment of INR 45,000 recorded via UPI',
        amount: 45000,
        referenceId: 'PAY-001',
        timestamp: new Date(Date.now() - 3600 * 1000),
      },
    ];
  }

  async getOperationalMetrics(_orgId: string): Promise<Record<string, unknown>> {
    return { fulfillmentTimeHours: 18.5, orderAccuracyRate: 99.2, dispatchSpeedMinutes: 42 };
  }

  async getStaffPerformance(_orgId: string): Promise<Record<string, unknown>> {
    return { topSalesAgent: 'Priya Sharma', salesValue: 2400000, ordersClosed: 84 };
  }

  async getPeakBusinessHours(_orgId: string): Promise<Record<string, unknown>> {
    return { peakHourStart: 16, peakHourEnd: 20, busiestDay: 'Saturday' };
  }

  async getForecast(_orgId: string): Promise<Record<string, unknown>> {
    return { projectedNextMonthRevenue: 17200000, confidenceInterval: 92.5 };
  }

  async getRealTimeMonitoring(_orgId: string): Promise<Record<string, unknown>> {
    return { activeUsersNow: 24, ordersLastHour: 18, revenueLastHour: 195000 };
  }

  async getSecurityAuditLog(_orgId: string): Promise<Record<string, unknown>> {
    return { failedLogins24h: 3, suspiciousIps: 0, passwordResets24h: 1 };
  }

  async getComplianceDashboard(_orgId: string): Promise<Record<string, unknown>> {
    return { gstComplianceRate: 100, eInvoicingStatus: 'ACTIVE', auditPassRate: 98.4 };
  }

  async getDataHealth(_orgId: string): Promise<Record<string, unknown>> {
    return { databaseLatencyMs: 4, integrityCheck: 'PASSED', backupStatus: 'CURRENT' };
  }
}
