import { Request, Response, NextFunction } from 'express';
import { GetPublicPageBySlugUseCase } from '../../application/use-cases/GetPublicPageBySlugUseCase';
import { CreateStorefrontOrderUseCase } from '../../application/use-cases/CreateStorefrontOrderUseCase';

export class StorefrontPublicController {
  constructor(
    private readonly getPageBySlug: GetPublicPageBySlugUseCase,
    private readonly createOrder: CreateStorefrontOrderUseCase
  ) {}

  public getPageHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const organizationId = (req.headers['x-organization-id'] as string) || (req.query.organizationId as string);
      if (!organizationId) {
        res.status(400).json({ status: 'fail', message: 'Organization ID is required' });
        return;
      }

      const slug = req.params.slug as string;
      const page = await this.getPageBySlug.execute({ slug, organizationId });

      if (!page) {
        res.status(404).json({ status: 'fail', message: 'Page not found or not published' });
        return;
      }

      res.status(200).json({ status: 'success', data: page.props });
    } catch (err) {
      next(err);
    }
  };

  public checkoutHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const organizationId =
        (req.headers['x-organization-id'] as string) ||
        (req.body.organizationId as string) ||
        (req.query.organizationId as string);

      if (!organizationId) {
        res.status(400).json({ status: 'fail', message: 'Organization ID is required' });
        return;
      }

      const result = await this.createOrder.execute(req.body, { organizationId });
      res.status(201).json({ status: 'success', data: result });
    } catch (err) {
      next(err);
    }
  };
}
