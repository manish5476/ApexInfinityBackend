import { AnalyticsUseCases } from '../../../../src/modules/analytics/application/use-cases/AnalyticsUseCases';
import { IAnalyticsRepository } from '../../../../src/modules/analytics/domain/ports/IAnalyticsRepository';

describe('Analytics & BI Module — Use Cases', () => {
  let mockRepo: jest.Mocked<IAnalyticsRepository>;
  let useCases: AnalyticsUseCases;

  const orgId = 'org-analytics-test';

  beforeEach(() => {
    mockRepo = {
      getDashboardOverview: jest.fn().mockResolvedValue({
        totalRevenue: 50000,
        totalOrders: 120,
        activeCustomers: 45,
        inventoryValuation: 200000,
        outstandingReceivables: 15000,
        revenueGrowthPercentage: 12.5,
        lastUpdated: new Date().toISOString(),
      }),
      getBranchComparison: jest.fn().mockResolvedValue({
        branches: [{ branchId: 'b1', name: 'Branch One', revenue: 50000, orders: 120 }],
      }),
      getFinancialTrend: jest.fn().mockResolvedValue([
        { period: '2024-01', income: 10000, expense: 5000, netProfit: 5000 },
        { period: '2024-02', income: 20000, expense: 8000, netProfit: 12000 },
        { period: '2024-03', income: 20000, expense: 7000, netProfit: 13000 },
      ]),
      getGrossProfitTrend: jest.fn().mockResolvedValue([
        { period: '2024-01', revenue: 10000, cogs: 6000, grossProfit: 4000, marginPercentage: 40 },
      ]),
      getYoYGrowth: jest.fn().mockResolvedValue({ currentYearTotal: 50000, previousYearTotal: 40000, growthRate: 25 }),
      getPurchaseVsSales: jest.fn().mockResolvedValue({ salesTotal: 50000, purchaseTotal: 30000, netCashImpact: 20000 }),
      getSalesReturnRate: jest.fn().mockResolvedValue({ returnRatePercentage: 1.5, totalReturns: 3, returnedValue: 500 }),
      getSalesDistribution: jest.fn().mockResolvedValue({
        labels: ['Electronics', 'Home'],
        datasets: [{ label: 'Sales', data: [70, 30] }],
      }),
      getPaymentMethodBreakdown: jest.fn().mockResolvedValue({
        labels: ['UPI', 'Credit Card'],
        datasets: [{ label: 'Payment Methods', data: [80, 20] }],
      }),
      getBranchPerformanceRadar: jest.fn().mockResolvedValue({ scores: [80, 90, 85] }),
      getTopPerformers: jest.fn().mockResolvedValue([{ id: '1', name: 'Top Product', value: 10000, rank: 1 }]),
      getOrderFunnel: jest.fn().mockResolvedValue({ created: 100, active: 80, partial: 10, paid: 70 }),
      getAOVTrend: jest.fn().mockResolvedValue({ averageOrderValue: 416.66, orderCount: 120 }),
      getHeatmap: jest.fn().mockResolvedValue([{ day: 1, hour: 10, count: 5 }]),
      getCustomerAcquisition: jest.fn().mockResolvedValue({
        labels: ['Jan', 'Feb'],
        datasets: [{ label: 'New', data: [20, 25] }],
      }),
      getCustomerOutstanding: jest.fn().mockResolvedValue([{ customerId: 'c1', name: 'Customer A', outstanding: 5000, creditLimit: 10000 }]),
      getInventoryHealth: jest.fn().mockResolvedValue({ healthyCount: 100, lowStockCount: 5, criticalCount: 1, outOfStockCount: 0 }),
      getEmiPortfolioStats: jest.fn().mockResolvedValue({ activePlans: 10, totalPrincipal: 100000, overdueCount: 0, overdueAmount: 0 }),
      getAttendanceKpis: jest.fn().mockResolvedValue({ averagePresentRate: 95, averageLateRate: 3, averageAbsentRate: 2 }),
      getLeaveUtilization: jest.fn().mockResolvedValue({ totalEntitled: 100, totalConsumed: 20, utilizationRate: 20 }),
      getCustomerOverview: jest.fn().mockResolvedValue({ totalCustomers: 50, activeCustomers: 45, churnRate: 1.0 }),
      getCustomerFinancialAnalytics: jest.fn().mockResolvedValue({ totalSpend: 50000, avgSpendPerCustomer: 1111.11, topSpenderSegment: 'High' }),
      getCustomerPaymentBehavior: jest.fn().mockResolvedValue({ onTimePercentage: 90, latePercentage: 8, defaultPercentage: 2 }),
      getCustomerLifetimeValue: jest.fn().mockResolvedValue({ averageLTV: 1111, highestLTV: 5000, segmentLTV: {} }),
      getCustomerSegmentation: jest.fn().mockResolvedValue({ champions: 10, loyal: 20, potentialLoyalists: 10, atRisk: 3, lost: 2 }),
      getCustomerGeospatial: jest.fn().mockResolvedValue({ regions: [{ state: 'Maharashtra', count: 45 }] }),
      getCustomerFeed: jest.fn().mockResolvedValue([
        { id: 'f1', customerId: 'cust-123', organizationId: orgId, type: 'sale', title: 'Order', description: 'Order', amount: 1000, referenceId: 'INV-1', timestamp: new Date() },
        { id: 'f2', customerId: 'cust-123', organizationId: orgId, type: 'payment', title: 'Payment', description: 'Payment', amount: 1000, referenceId: 'PAY-1', timestamp: new Date() },
      ]),
      getOperationalMetrics: jest.fn().mockResolvedValue({ fulfillmentTimeHours: 12, orderAccuracyRate: 99, dispatchSpeedMinutes: 30 }),
      getStaffPerformance: jest.fn().mockResolvedValue({ topSalesAgent: 'Agent One', salesValue: 25000, ordersClosed: 50 }),
      getPeakBusinessHours: jest.fn().mockResolvedValue({ peakHourStart: 14, peakHourEnd: 18, busiestDay: 'Friday' }),
      getForecast: jest.fn().mockResolvedValue({ projectedNextMonthRevenue: 60000, confidenceInterval: 90 }),
      getRealTimeMonitoring: jest.fn().mockResolvedValue({ activeUsersNow: 5, ordersLastHour: 3, revenueLastHour: 1500 }),
      getSecurityAuditLog: jest.fn().mockResolvedValue({ failedLogins24h: 0, suspiciousIps: 0, passwordResets24h: 0 }),
      getComplianceDashboard: jest.fn().mockResolvedValue({ gstComplianceRate: 100, eInvoicingStatus: 'ACTIVE', auditPassRate: 100 }),
      getDataHealth: jest.fn().mockResolvedValue({ databaseLatencyMs: 2, integrityCheck: 'PASSED', backupStatus: 'CURRENT' }),
    } as unknown as jest.Mocked<IAnalyticsRepository>;

    useCases = new AnalyticsUseCases(mockRepo);
  });

  describe('Executive & Financial Analytics', () => {
    it('returns dashboard overview metrics with growth percentage', async () => {
      const overview = await useCases.getDashboardOverview(orgId);
      expect(mockRepo.getDashboardOverview).toHaveBeenCalledWith(orgId);
      expect(overview.totalRevenue).toBe(50000);
      expect(overview.activeCustomers).toBe(45);
      expect(overview.revenueGrowthPercentage).toBe(12.5);
    });

    it('returns financial trends and gross profit analysis', async () => {
      const trend = await useCases.getFinancialTrend(orgId, 2024);
      expect(mockRepo.getFinancialTrend).toHaveBeenCalledWith(orgId, 2024);
      expect(trend.length).toBe(3);
      expect(trend[0]!.income).toBeGreaterThan(trend[0]!.expense);

      const gp = await useCases.getGrossProfitTrend(orgId, 2024);
      expect(mockRepo.getGrossProfitTrend).toHaveBeenCalledWith(orgId, 2024);
      expect(gp[0]!.marginPercentage).toBe(40);
    });

    it('returns YoY growth and purchase vs sales comparisons', async () => {
      const yoy = await useCases.getYoYGrowth(orgId);
      expect(mockRepo.getYoYGrowth).toHaveBeenCalledWith(orgId, undefined);
      expect(yoy['growthRate']).toBe(25);

      const pvs = await useCases.getPurchaseVsSales(orgId);
      expect(mockRepo.getPurchaseVsSales).toHaveBeenCalledWith(orgId, undefined);
      expect(pvs['netCashImpact']).toBe(20000);
    });
  });

  describe('Charts & Visual Data', () => {
    it('generates multi-category sales distribution and payment methods chart series', async () => {
      const distribution = await useCases.getSalesDistribution(orgId, 'category');
      expect(mockRepo.getSalesDistribution).toHaveBeenCalledWith(orgId, 'category', undefined, undefined);
      expect(distribution.labels.length).toBe(2);

      const payment = await useCases.getPaymentMethodBreakdown(orgId);
      expect(mockRepo.getPaymentMethodBreakdown).toHaveBeenCalledWith(orgId, undefined, undefined);
      expect(payment.labels).toContain('UPI');
      expect(payment.labels).toContain('Credit Card');
    });

    it('computes branch radar, order funnel, and hourly heatmap', async () => {
      const radar = await useCases.getBranchPerformanceRadar(orgId);
      expect(mockRepo.getBranchPerformanceRadar).toHaveBeenCalledWith(orgId, undefined, undefined);
      expect(radar['scores']).toBeDefined();

      const funnel = await useCases.getOrderFunnel(orgId);
      expect(mockRepo.getOrderFunnel).toHaveBeenCalledWith(orgId, undefined, undefined);
      expect(funnel['created']).toBe(100);

      const heatmap = await useCases.getHeatmap(orgId);
      expect(mockRepo.getHeatmap).toHaveBeenCalledWith(orgId, undefined, undefined);
      expect(heatmap.length).toBe(1);
    });
  });

  describe('Customer Intelligence & Feed', () => {
    it('returns customer segmentation, LTV, and payment behavior', async () => {
      const segmentation = await useCases.getCustomerSegmentation(orgId);
      expect(segmentation['champions']).toBe(10);

      const ltv = await useCases.getCustomerLifetimeValue(orgId);
      expect(ltv['averageLTV']).toBe(1111);

      const behavior = await useCases.getCustomerPaymentBehavior(orgId);
      expect(behavior['onTimePercentage']).toBe(90);
    });

    it('retrieves chronological customer activity feed', async () => {
      const feed = await useCases.getCustomerFeed(orgId, 'cust-123');
      expect(mockRepo.getCustomerFeed).toHaveBeenCalledWith(orgId, 'cust-123');
      expect(feed.length).toBe(2);
      expect(feed[0]!.type).toBe('sale');
      expect(feed[1]!.type).toBe('payment');
    });
  });

  describe('Operations, Forecast & Health', () => {
    it('returns operational speed, staff performance, forecast, and system data health', async () => {
      const ops = await useCases.getOperationalMetrics(orgId);
      expect(ops['orderAccuracyRate']).toBe(99);

      const staff = await useCases.getStaffPerformance(orgId);
      expect(staff['topSalesAgent']).toBe('Agent One');

      const forecast = await useCases.getForecast(orgId);
      expect(forecast['projectedNextMonthRevenue']).toBe(60000);

      const health = await useCases.getDataHealth(orgId);
      expect(health['integrityCheck']).toBe('PASSED');
    });
  });
});
