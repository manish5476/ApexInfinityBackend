import { Request, Response, NextFunction } from 'express';
import { CreateStorefrontPageUseCase } from '../../application/use-cases/CreateStorefrontPageUseCase';
import { PublishStorefrontPageUseCase } from '../../application/use-cases/PublishStorefrontPageUseCase';
import { ListStorefrontPagesUseCase } from '../../application/use-cases/ListStorefrontPagesUseCase';
import { RequestContextHolder } from '../../../../middleware/requestContext.middleware';
import { PageStatus, PageType } from '../../domain/value-objects/StorefrontEnums';

export class StorefrontAdminController {
  constructor(
    private readonly createPage: CreateStorefrontPageUseCase,
    private readonly publishPage: PublishStorefrontPageUseCase,
    private readonly listPages: ListStorefrontPagesUseCase
  ) {}

  public createPageHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ctx = RequestContextHolder.get()!;
      const result = await this.createPage.execute(req.body, { organizationId: ctx.organizationId! });
      res.status(201).json({ status: 'success', data: result.props });
    } catch (err) {
      next(err);
    }
  };

  public publishPageHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ctx = RequestContextHolder.get()!;
      const result = await this.publishPage.execute(
        { pageId: req.params.id as string },
        { organizationId: ctx.organizationId! }
      );
      res.status(200).json({ status: 'success', data: result.props });
    } catch (err) {
      next(err);
    }
  };

  public listPagesHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ctx = RequestContextHolder.get()!;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const status = req.query.status as PageStatus | undefined;
      const pageType = req.query.pageType as PageType | undefined;
      const search = (req.query.search as string) || undefined;

      const result = await this.listPages.execute(
        { page, limit, status, pageType, search },
        { organizationId: ctx.organizationId! }
      );

      res.status(200).json({
        status: 'success',
        data: result.data.map((p) => p.props),
        total: result.total,
      });
    } catch (err) {
      next(err);
    }
  };
}
