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

export class CustomerAnalyticsController {
  constructor(private readonly useCases: AnalyticsUseCases) {}

  getCustomerOverview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      sendOk(res, await this.useCases.getCustomerOverview(getOrgId(req)));
    } catch (err) { next(err); }
  };

  getCustomerFinancialAnalytics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      sendOk(res, await this.useCases.getCustomerFinancialAnalytics(getOrgId(req)));
    } catch (err) { next(err); }
  };

  getCustomerPaymentBehavior = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      sendOk(res, await this.useCases.getCustomerPaymentBehavior(getOrgId(req)));
    } catch (err) { next(err); }
  };

  getCustomerLifetimeValue = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      sendOk(res, await this.useCases.getCustomerLifetimeValue(getOrgId(req)));
    } catch (err) { next(err); }
  };

  getCustomerSegmentation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      sendOk(res, await this.useCases.getCustomerSegmentation(getOrgId(req)));
    } catch (err) { next(err); }
  };

  getCustomerGeospatial = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      sendOk(res, await this.useCases.getCustomerGeospatial(getOrgId(req)));
    } catch (err) { next(err); }
  };

  getRealTimeDashboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      sendOk(res, await this.useCases.getRealTimeMonitoring(getOrgId(req)));
    } catch (err) { next(err); }
  };

  getCustomerEMIAnalytics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      sendOk(res, await this.useCases.getEmiPortfolioStats(getOrgId(req)));
    } catch (err) { next(err); }
  };

  exportFinancialsToCSV = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      sendOk(res, { downloadUrl: '/api/v1/assets/exports/customer_financials.csv' });
    } catch (err) { next(err); }
  };
}
