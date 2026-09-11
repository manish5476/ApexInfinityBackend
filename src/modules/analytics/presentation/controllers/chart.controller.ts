import { Request, Response, NextFunction } from 'express';
import { AnalyticsUseCases } from '../../application/use-cases/AnalyticsUseCases';
import { RequestContextHolder } from '../../../../middleware/requestContext.middleware';

function getOrgId(req: Request): string {
  const ctx = RequestContextHolder.get();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = (req as any).user;
  return ctx?.organizationId || user?.organizationId || (req.headers['x-organization-id'] as string) || '';
}

function parseYear(req: Request): number | undefined {
  return req.query.year ? parseInt(req.query.year as string, 10) : undefined;
}

function sendOk(res: Response, data: unknown): void {
  res.status(200).json({ status: 'success', data });
}

export class ChartController {
  constructor(private readonly useCases: AnalyticsUseCases) {}

  // 1. Financial Trend
  getFinancialTrend = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      sendOk(res, await this.useCases.getFinancialTrend(getOrgId(req), parseYear(req)));
    } catch (err) { next(err); }
  };

  // 2. Gross Profit Trend
  getGrossProfitTrend = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      sendOk(res, await this.useCases.getGrossProfitTrend(getOrgId(req), parseYear(req)));
    } catch (err) { next(err); }
  };

  // 3. YoY Growth
  getYoYGrowth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      sendOk(res, await this.useCases.getYoYGrowth(getOrgId(req), parseYear(req)));
    } catch (err) { next(err); }
  };

  // 4. Purchase vs Sales
  getPurchaseVsSales = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      sendOk(res, await this.useCases.getPurchaseVsSales(getOrgId(req), parseYear(req)));
    } catch (err) { next(err); }
  };

  // 5. Return Rate
  getSalesReturnRate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      sendOk(res, await this.useCases.getSalesReturnRate(getOrgId(req), parseYear(req)));
    } catch (err) { next(err); }
  };

  // 6. Sales Distribution
  getSalesDistribution = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { groupBy, startDate, endDate } = req.query as Record<string, string>;
      sendOk(res, await this.useCases.getSalesDistribution(getOrgId(req), groupBy, startDate, endDate));
    } catch (err) { next(err); }
  };

  // 7. Payment Methods
  getPaymentMethodBreakdown = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { startDate, endDate } = req.query as Record<string, string>;
      sendOk(res, await this.useCases.getPaymentMethodBreakdown(getOrgId(req), startDate, endDate));
    } catch (err) { next(err); }
  };

  // 8. Branch Radar
  getBranchPerformanceRadar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { startDate, endDate } = req.query as Record<string, string>;
      sendOk(res, await this.useCases.getBranchPerformanceRadar(getOrgId(req), startDate, endDate));
    } catch (err) { next(err); }
  };

  // 9. Top Performers
  getTopPerformers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { type, limit, startDate, endDate } = req.query as Record<string, string>;
      sendOk(
        res,
        await this.useCases.getTopPerformers(
          getOrgId(req),
          type,
          limit ? parseInt(limit, 10) : 5,
          startDate,
          endDate,
        ),
      );
    } catch (err) { next(err); }
  };

  // 10. Order Funnel
  getOrderFunnel = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { startDate, endDate } = req.query as Record<string, string>;
      sendOk(res, await this.useCases.getOrderFunnel(getOrgId(req), startDate, endDate));
    } catch (err) { next(err); }
  };

  // 11. AOV Trend
  getAOVTrend = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      sendOk(res, await this.useCases.getAOVTrend(getOrgId(req), parseYear(req)));
    } catch (err) { next(err); }
  };

  // 12. Heatmap
  getHeatmap = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const branchId = req.query.branchId as string | undefined;
      const days = req.query.days ? parseInt(req.query.days as string, 10) : 30;
      sendOk(res, await this.useCases.getHeatmap(getOrgId(req), branchId, days));
    } catch (err) { next(err); }
  };

  // 13. Customer Acquisition
  getCustomerAcquisition = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      sendOk(res, await this.useCases.getCustomerAcquisition(getOrgId(req), parseYear(req)));
    } catch (err) { next(err); }
  };

  // 14. Customer Outstanding
  getCustomerOutstanding = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
      sendOk(res, await this.useCases.getCustomerOutstanding(getOrgId(req), limit));
    } catch (err) { next(err); }
  };

  // 15. Inventory Health
  getInventoryHealth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const branchId = req.query.branchId as string | undefined;
      sendOk(res, await this.useCases.getInventoryHealth(getOrgId(req), branchId));
    } catch (err) { next(err); }
  };

  // 16. EMI Portfolio
  getEmiPortfolioStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      sendOk(res, await this.useCases.getEmiPortfolioStats(getOrgId(req)));
    } catch (err) { next(err); }
  };

  // 17. Attendance KPIs
  getAttendanceKpis = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const branchId = req.query.branchId as string | undefined;
      const days = req.query.days ? parseInt(req.query.days as string, 10) : 30;
      sendOk(res, await this.useCases.getAttendanceKpis(getOrgId(req), branchId, days));
    } catch (err) { next(err); }
  };

  // 18. Leave Utilization
  getLeaveUtilization = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const financialYear = req.query.financialYear as string | undefined;
      sendOk(res, await this.useCases.getLeaveUtilization(getOrgId(req), financialYear));
    } catch (err) { next(err); }
  };
}
