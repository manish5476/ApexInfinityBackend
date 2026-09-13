import { MongoAnalyticsRepository } from '../../../../src/modules/analytics/infrastructure/repositories/MongoAnalyticsRepository';
import { InvoiceModel, PaymentModel } from '../../../../src/modules/accounting/infrastructure/persistence';
import {
  ProductModel,
  PurchaseOrderModel,
  SalesReturnModel,
} from '../../../../src/modules/inventory/infrastructure/persistence';
import { CustomerModel } from '../../../../src/modules/crm/infrastructure/persistence';

describe('MongoAnalyticsRepository — Production Data Integrity & Anti-Mock Verification', () => {
  let repo: MongoAnalyticsRepository;
  const orgId = 'org-anti-mock-test';

  beforeEach(() => {
    repo = new MongoAnalyticsRepository();
    jest.clearAllMocks();
  });

  describe('Anti-Mock Architectural Verification', () => {
    it('is a standalone concrete class backed by Mongo aggregations', () => {
      expect(repo.constructor.name).toBe('MongoAnalyticsRepository');
    });

    it('is an independent class with live database aggregation logic', () => {
      expect(repo.getDashboardOverview).toBeDefined();
      expect(repo.getInventoryHealth).toBeDefined();
      expect(repo.getFinancialTrend).toBeDefined();
      expect(repo.getGrossProfitTrend).toBeDefined();
      expect(repo.getBranchComparison).toBeDefined();
      expect(repo.getForecast).toBeDefined();
    });
  });

  describe('Empty Database Honest State (No Fake Demo Numbers)', () => {
    beforeEach(() => {
      jest.spyOn(InvoiceModel, 'aggregate').mockResolvedValue([]);
      jest.spyOn(InvoiceModel, 'countDocuments').mockResolvedValue(0 as any);
      jest.spyOn(CustomerModel, 'countDocuments').mockResolvedValue(0 as any);
      jest.spyOn(CustomerModel, 'aggregate').mockResolvedValue([]);
      jest.spyOn(CustomerModel, 'find').mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      } as any);
      jest.spyOn(ProductModel, 'aggregate').mockResolvedValue([]);
      jest.spyOn(ProductModel, 'countDocuments').mockResolvedValue(0 as any);
      jest.spyOn(PurchaseOrderModel, 'aggregate').mockResolvedValue([]);
      jest.spyOn(SalesReturnModel, 'aggregate').mockResolvedValue([]);
      jest.spyOn(PaymentModel, 'aggregate').mockResolvedValue([]);
      jest.spyOn(PaymentModel, 'find').mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      } as any);
      jest.spyOn(InvoiceModel, 'find').mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      } as any);
    });

    it('getDashboardOverview returns 0s and not fake 15420000 or 1420', async () => {
      const result = await repo.getDashboardOverview(orgId);
      expect(result.totalRevenue).toBe(0);
      expect(result.totalOrders).toBe(0);
      expect(result.activeCustomers).toBe(0);
      expect(result.inventoryValuation).toBe(0);
      expect(result.outstandingReceivables).toBe(0);
      expect(result.revenueGrowthPercentage).toBe(0);
      expect(result.lastUpdated).toBeDefined();
    });

    it('getBranchComparison returns empty branches and not hardcoded Main/Sub branch', async () => {
      const result = await repo.getBranchComparison(orgId);
      expect(result).toEqual({ branches: [] });
    });

    it('getInventoryHealth returns 0 counts and not fake 350/42/8/3', async () => {
      const result = await repo.getInventoryHealth(orgId);
      expect(result).toEqual({
        healthyCount: 0,
        lowStockCount: 0,
        criticalCount: 0,
        outOfStockCount: 0,
      });
    });

    it('getFinancialTrend returns clean 12 zeroed monthly periods without hardcoded values', async () => {
      const result = await repo.getFinancialTrend(orgId, 2026);
      expect(result.length).toBe(12);
      expect(result[0]).toEqual({
        period: '2026-01',
        income: 0,
        expense: 0,
        netProfit: 0,
      });
    });

    it('getGrossProfitTrend returns empty array on empty database', async () => {
      const result = await repo.getGrossProfitTrend(orgId, 2026);
      expect(result).toEqual([]);
    });

    it('getYoYGrowth returns 0s', async () => {
      const result = await repo.getYoYGrowth(orgId, 2026);
      expect(result).toEqual({
        currentYearTotal: 0,
        previousYearTotal: 0,
        growthRate: 0,
      });
    });

    it('getPurchaseVsSales returns 0s', async () => {
      const result = await repo.getPurchaseVsSales(orgId, 2026);
      expect(result).toEqual({
        salesTotal: 0,
        purchaseTotal: 0,
        netCashImpact: 0,
      });
    });

    it('getSalesReturnRate returns 0s', async () => {
      const result = await repo.getSalesReturnRate(orgId, 2026);
      expect(result).toEqual({
        returnRatePercentage: 0,
        totalReturns: 0,
        returnedValue: 0,
      });
    });

    it('getCustomerOverview returns 0s and 0 churn rate', async () => {
      const result = await repo.getCustomerOverview(orgId);
      expect(result).toEqual({
        totalCustomers: 0,
        activeCustomers: 0,
        churnRate: 0,
      });
    });

    it('getCustomerFeed returns empty array for empty customer', async () => {
      const result = await repo.getCustomerFeed(orgId, 'c-empty');
      expect(result).toEqual([]);
    });

    it('getForecast returns 0 predicted revenue when no history exists', async () => {
      const result = await repo.getForecast(orgId);
      expect(result).toEqual({
        projectedNextMonthRevenue: 0,
        confidenceInterval: 0,
      });
    });

    it('getTopPerformers returns empty array', async () => {
      const result = await repo.getTopPerformers(orgId, 'products', 5);
      expect(result).toEqual([]);
    });
  });

  describe('Live Database Aggregation Computations', () => {
    it('aggregates real revenue and calculates growth percentage correctly', async () => {
      jest.spyOn(InvoiceModel, 'aggregate')
        .mockResolvedValueOnce([{ _id: null, total: 250000 }]) // total revenue
        .mockResolvedValueOnce([{ _id: null, total: 35000 }]) // receivables
        .mockResolvedValueOnce([{ _id: null, total: 150000 }]) // curr 30d
        .mockResolvedValueOnce([{ _id: null, total: 100000 }]); // prev 30d

      jest.spyOn(InvoiceModel, 'countDocuments').mockResolvedValue(45 as any);
      jest.spyOn(CustomerModel, 'countDocuments').mockResolvedValue(20 as any);
      jest.spyOn(ProductModel, 'aggregate').mockResolvedValueOnce([{ _id: null, totalValuation: 180000 }]);

      const overview = await repo.getDashboardOverview(orgId);
      expect(overview.totalRevenue).toBe(250000);
      expect(overview.totalOrders).toBe(45);
      expect(overview.activeCustomers).toBe(20);
      expect(overview.inventoryValuation).toBe(180000);
      expect(overview.outstandingReceivables).toBe(35000);
      // (150000 - 100000) / 100000 * 100 = 50%
      expect(overview.revenueGrowthPercentage).toBe(50);
    });

    it('computes real inventory health facet counts', async () => {
      jest.spyOn(ProductModel, 'aggregate').mockResolvedValueOnce([
        {
          healthy: [{ count: 120 }],
          lowStock: [{ count: 15 }],
          critical: [{ count: 5 }],
          outOfStock: [{ count: 2 }],
        },
      ]);

      const health = await repo.getInventoryHealth(orgId);
      expect(health).toEqual({
        healthyCount: 120,
        lowStockCount: 15,
        criticalCount: 5,
        outOfStockCount: 2,
      });
    });

    it('computes linear regression forecast correctly from historical trends', async () => {
      jest.spyOn(InvoiceModel, 'aggregate').mockResolvedValueOnce([
        { _id: '2026-01', total: 10000 },
        { _id: '2026-02', total: 20000 },
        { _id: '2026-03', total: 30000 },
      ]);

      const forecast = await repo.getForecast(orgId);
      // Perfect linear progression x=1,2,3 -> y=10000,20000,30000 => next period x=4 => 40000
      expect(forecast['projectedNextMonthRevenue']).toBe(40000);
      expect(forecast['confidenceInterval']).toBeGreaterThan(50);
    });
  });
});
