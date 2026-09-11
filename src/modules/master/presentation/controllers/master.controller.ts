import { Request, Response, NextFunction } from 'express';
import { MasterItemUseCases } from '../../application/use-cases/MasterItemUseCases';
import { RequestContextHolder } from '../../../../middleware/requestContext.middleware';

export class MasterController {
  constructor(private readonly masterUseCases: MasterItemUseCases) {}

  public createMaster = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ctx = RequestContextHolder.get()!;
      const result = await this.masterUseCases.createMaster(ctx.organizationId!, req.body);
      res.status(201).json({
        status: 'success',
        data: { master: result.props },
      });
    } catch (err) {
      next(err);
    }
  };

  public getMasters = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ctx = RequestContextHolder.get()!;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const type = req.query.type as string | undefined;
      const search = req.query.search as string | undefined;
      const isActive = req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined;
      const parentId = req.query.parentId as string | undefined;

      const result = await this.masterUseCases.getMasters(ctx.organizationId!, {
        page,
        limit,
        type,
        search,
        isActive,
        parentId,
      });

      res.status(200).json({
        status: 'success',
        results: result.data.length,
        pagination: {
          page,
          limit,
          totalResults: result.total,
          totalPages: Math.ceil(result.total / limit),
        },
        data: {
          masters: result.data.map((m) => m.props),
          totalRecords: result.total,
        },
      });
    } catch (err) {
      next(err);
    }
  };

  public updateMaster = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ctx = RequestContextHolder.get()!;
      const result = await this.masterUseCases.updateMaster(
        ctx.organizationId!,
        req.params.id as string,
        req.body
      );
      res.status(200).json({
        status: 'success',
        data: { master: result.props },
      });
    } catch (err) {
      next(err);
    }
  };

  public deleteMaster = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ctx = RequestContextHolder.get()!;
      await this.masterUseCases.deleteMaster(ctx.organizationId!, req.params.id as string);
      res.status(200).json({
        status: 'success',
        message: 'Master deactivated successfully',
      });
    } catch (err) {
      next(err);
    }
  };

  public bulkCreateMasters = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ctx = RequestContextHolder.get()!;
      const result = await this.masterUseCases.bulkCreateMasters(ctx.organizationId!, req.body.items);

      if (result.failed.length > 0) {
        res.status(207).json({
          status: 'partial_success',
          insertedCount: result.inserted.length,
          failedCount: result.failed.length,
          failedItems: result.failed,
          data: { masters: result.inserted.map((m) => m.props) },
        });
        return;
      }

      res.status(201).json({
        status: 'success',
        insertedCount: result.inserted.length,
        data: { masters: result.inserted.map((m) => m.props) },
      });
    } catch (err) {
      next(err);
    }
  };

  public bulkUpdateMasters = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ctx = RequestContextHolder.get()!;
      const modifiedCount = await this.masterUseCases.bulkUpdateMasters(ctx.organizationId!, req.body.items);
      res.status(200).json({
        status: 'success',
        message: 'Bulk update completed',
        modifiedCount,
      });
    } catch (err) {
      next(err);
    }
  };

  public bulkDeleteMasters = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ctx = RequestContextHolder.get()!;
      const count = await this.masterUseCases.bulkDeleteMasters(ctx.organizationId!, req.body.ids);
      res.status(200).json({
        status: 'success',
        message: `${count} items deactivated successfully`,
      });
    } catch (err) {
      next(err);
    }
  };
}
