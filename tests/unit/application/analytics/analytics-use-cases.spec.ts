import { AnalyticsUseCases } from '../../../../src/modules/analytics/application/use-cases/AnalyticsUseCases';
import { InMemoryAnalyticsRepository } from '../../../../src/modules/analytics/infrastructure/repositories/InMemoryAnalyticsRepository';

describe('Analytics & BI Module — Use Cases', () => {
  let repo: InMemoryAnalyticsRepository;
  let useCases: AnalyticsUseCases;

  const orgId = 'org-analytics-test';

  beforeEach(() => {
    repo = new InMemoryAnalyticsRepository();
    useCases = new AnalyticsUseCases(repo);
  });

  describe('Executive & Financial Analytics', () => {
    it('returns dashboard overview metrics with growth percentage', async () => {
      const overview = await useCases.getDashboardOverview(orgId);
      expect(overview.totalRevenue).toBeGreaterThan(0);
      expect(overview.activeCustomers).toBeGreaterThan(0);
      expect(overview.revenueGrowthPercentage).toBeDefined();
    });

    it('returns financial trends and gross profit analysis', async () => {
      const trend = await useCases.getFinancialTrend(orgId, 2024);
      expect(trend.length).toBeGreaterThanOrEqual(3);
      expect(trend[0]!.income).toBeGreaterThan(trend[0]!.expense);

      const gp = await useCases.getGrossProfitTrend(orgId, 2024);
      expect(gp[0]!.marginPercentage).toBeGreaterThan(0);
    });

    it('returns YoY growth and purchase vs sales comparisons', async () => {
      const yoy = await useCases.getYoYGrowth(orgId);
      expect(yoy['growthRate']).toBeGreaterThan(0);

      const pvs = await useCases.getPurchaseVsSales(orgId);
      expect(pvs['netCashImpact']).toBeGreaterThan(0);
    });
  });

  describe('Charts & Visual Data', () => {
    it('generates multi-category sales distribution and payment methods chart series', async () => {
      const distribution = await useCases.getSalesDistribution(orgId, 'category');
      expect(distribution.labels.length).toBeGreaterThan(0);
      expect(distribution.datasets[0]!.data.length).toBe(distribution.labels.length);

      const payment = await useCases.getPaymentMethodBreakdown(orgId);
      expect(payment.labels).toContain('UPI');
      expect(payment.labels).toContain('Credit Card');
    });

    it('computes branch radar, order funnel, and hourly heatmap', async () => {
      const radar = await useCases.getBranchPerformanceRadar(orgId);
      expect(radar['scores']).toBeDefined();

      const funnel = await useCases.getOrderFunnel(orgId);
      expect(funnel['created']).toBeDefined();
      expect(funnel['paid']).toBeDefined();

      const heatmap = await useCases.getHeatmap(orgId);
      expect(heatmap.length).toBeGreaterThan(0);
      expect(heatmap[0]!.hour).toBeDefined();
    });
  });

  describe('Customer Intelligence & Feed', () => {
    it('returns customer segmentation, LTV, and payment behavior', async () => {
      const segmentation = await useCases.getCustomerSegmentation(orgId);
      expect(segmentation['champions']).toBeGreaterThan(0);

      const ltv = await useCases.getCustomerLifetimeValue(orgId);
      expect(ltv['averageLTV']).toBeGreaterThan(0);

      const behavior = await useCases.getCustomerPaymentBehavior(orgId);
      expect(behavior['onTimePercentage']).toBeGreaterThan(50);
    });

    it('retrieves chronological customer activity feed', async () => {
      const feed = await useCases.getCustomerFeed(orgId, 'cust-123');
      expect(feed.length).toBeGreaterThanOrEqual(2);
      expect(feed[0]!.type).toBe('sale');
      expect(feed[1]!.type).toBe('payment');
    });
  });

  describe('Operations, Forecast & Health', () => {
    it('returns operational speed, staff performance, forecast, and system data health', async () => {
      const ops = await useCases.getOperationalMetrics(orgId);
      expect(ops['orderAccuracyRate']).toBeGreaterThan(90);

      const staff = await useCases.getStaffPerformance(orgId);
      expect(staff['topSalesAgent']).toBeDefined();

      const forecast = await useCases.getForecast(orgId);
      expect(forecast['projectedNextMonthRevenue']).toBeGreaterThan(0);

      const health = await useCases.getDataHealth(orgId);
      expect(health['integrityCheck']).toBe('PASSED');
    });
  });
});
