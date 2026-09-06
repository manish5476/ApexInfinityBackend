import { Request, Response, NextFunction } from 'express';
import { CreateBranchUseCase } from '../application/use-cases/CreateBranchUseCase';
import { ListBranchesUseCase } from '../application/use-cases/ListBranchesUseCase';
import { GetBranchByIdUseCase } from '../application/use-cases/GetBranchByIdUseCase';
import { UpdateBranchUseCase } from '../application/use-cases/UpdateBranchUseCase';
import { DeleteBranchUseCase } from '../application/use-cases/DeleteBranchUseCase';
import { RequestContextHolder } from '../../../middleware/requestContext.middleware';
import { ApiResponseFactory } from '../../../shared/contracts';
import { UnauthorizedError } from '../../../shared/errors';

export class BranchController {
  constructor(
    private readonly createBranchUseCase: CreateBranchUseCase,
    private readonly listBranchesUseCase: ListBranchesUseCase,
    private readonly getBranchByIdUseCase: GetBranchByIdUseCase,
    private readonly updateBranchUseCase: UpdateBranchUseCase,
    private readonly deleteBranchUseCase: DeleteBranchUseCase
  ) {}

  public create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ctx = RequestContextHolder.get();
      if (!ctx?.organizationId) {
        return next(new UnauthorizedError('Organization ID is required.'));
      }

      const result = await this.createBranchUseCase.execute({
        organizationId: ctx.organizationId,
        ...req.body,
      });

      if (result.isFailure) {
        return next(result.getError());
      }

      res.status(201).json(ApiResponseFactory.success(result.getValue().props));
    } catch (err) {
      next(err);
    }
  };

  public list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ctx = RequestContextHolder.get();
      if (!ctx?.organizationId) {
        return next(new UnauthorizedError('Organization ID is required.'));
      }

      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const search = req.query.search as string | undefined;
      const isActive = req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined;

      const result = await this.listBranchesUseCase.execute({
        organizationId: ctx.organizationId,
        page,
        limit,
        search,
        isActive,
      });

      if (result.isFailure) {
        return next(result.getError());
      }

      const value = result.getValue();
      res.status(200).json(
        ApiResponseFactory.success(
          value.data.map((b) => b.props),
          { page, limit, total: value.total }
        )
      );
    } catch (err) {
      next(err);
    }
  };

  public getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ctx = RequestContextHolder.get();
      if (!ctx?.organizationId) {
        return next(new UnauthorizedError('Organization ID is required.'));
      }

      const result = await this.getBranchByIdUseCase.execute({
        id: req.params.id as string,
        organizationId: ctx.organizationId,
      });

      if (result.isFailure) {
        return next(result.getError());
      }

      res.status(200).json(ApiResponseFactory.success(result.getValue().props));
    } catch (err) {
      next(err);
    }
  };

  public update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ctx = RequestContextHolder.get();
      if (!ctx?.organizationId) {
        return next(new UnauthorizedError('Organization ID is required.'));
      }

      const result = await this.updateBranchUseCase.execute({
        id: req.params.id as string,
        organizationId: ctx.organizationId,
        ...req.body,
      });

      if (result.isFailure) {
        return next(result.getError());
      }

      res.status(200).json(ApiResponseFactory.success(result.getValue().props));
    } catch (err) {
      next(err);
    }
  };

  public delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ctx = RequestContextHolder.get();
      if (!ctx?.organizationId) {
        return next(new UnauthorizedError('Organization ID is required.'));
      }

      const result = await this.deleteBranchUseCase.execute({
        id: req.params.id as string,
        organizationId: ctx.organizationId,
      });

      if (result.isFailure) {
        return next(result.getError());
      }

      res.status(200).json(ApiResponseFactory.success({ deleted: true }));
    } catch (err) {
      next(err);
    }
  };
}
