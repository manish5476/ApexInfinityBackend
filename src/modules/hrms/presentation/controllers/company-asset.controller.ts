import { Request, Response, NextFunction } from 'express';
import { CompanyAssetUseCases } from '../../application/use-cases/CompanyAssetUseCases';
import { ApiResponseFactory } from '../../../../shared/contracts';
import { getHrmsContext } from './context.helper';

export class CompanyAssetController {
  constructor(private readonly assetUseCases: CompanyAssetUseCases) {}

  public create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const result = await this.assetUseCases.create(context.organizationId, req.body);
      res.status(201).json(ApiResponseFactory.success(result));
    } catch (err) {
      next(err);
    }
  };

  public list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const list = await this.assetUseCases.list(context.organizationId, {
        status: req.query.status as string | undefined,
        category: req.query.category as string | undefined,
        branchId: req.query.branchId as string | undefined,
        search: req.query.search as string | undefined,
      });
      res.status(200).json(ApiResponseFactory.success(list));
    } catch (err) {
      next(err);
    }
  };

  public getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const result = await this.assetUseCases.getById(context.organizationId, req.params.id!);
      res.status(200).json(ApiResponseFactory.success(result));
    } catch (err) {
      next(err);
    }
  };

  public update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const result = await this.assetUseCases.update(context.organizationId, req.params.id!, req.body);
      res.status(200).json(ApiResponseFactory.success(result));
    } catch (err) {
      next(err);
    }
  };

  public assign = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const result = await this.assetUseCases.assign(context.organizationId, req.params.id!, {
        ...req.body,
        processedBy: context.userId,
      });
      res.status(200).json(ApiResponseFactory.success(result));
    } catch (err) {
      next(err);
    }
  };

  public return = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const result = await this.assetUseCases.return(context.organizationId, req.params.id!, {
        ...req.body,
        processedBy: context.userId,
      });
      res.status(200).json(ApiResponseFactory.success(result));
    } catch (err) {
      next(err);
    }
  };
}
