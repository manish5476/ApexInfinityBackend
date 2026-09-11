import { Request, Response, NextFunction } from 'express';
import { AnalyticsUseCases } from '../../application/use-cases/AnalyticsUseCases';
import { RequestContextHolder } from '../../../../middleware/requestContext.middleware';

function getOrgId(req: Request): string {
  const ctx = RequestContextHolder.get();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = (req as any).user;
  return ctx?.organizationId || user?.organizationId || (req.headers['x-organization-id'] as string) || '';
}

export class FeedController {
  constructor(private readonly useCases: AnalyticsUseCases) {}

  getCustomerFeed = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = getOrgId(req);
      const customerId = (req.params.customerId as string) || '';

      const feed = await this.useCases.getCustomerFeed(orgId, customerId);

      res.status(200).json({
        status: 'success',
        results: feed.length,
        data: { feed },
      });
    } catch (err) {
      next(err);
    }
  };
}
