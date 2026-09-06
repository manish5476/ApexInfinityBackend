import { Request, Response, NextFunction } from 'express';
import { CreateDepartmentUseCase } from '../../application/use-cases/CreateDepartmentUseCase';
import { ListDepartmentsUseCase } from '../../application/use-cases/ListDepartmentsUseCase';
import { DepartmentUseCases } from '../../application/use-cases/DepartmentUseCases';
import { createDepartmentSchema } from '../validators/department.validator';
import { ApiResponseFactory } from '../../../../shared/contracts';
import { getHrmsContext } from './context.helper';

export class DepartmentController {
  constructor(
    private readonly createUseCase: CreateDepartmentUseCase,
    private readonly listUseCase: ListDepartmentsUseCase,
    private readonly departmentUseCases?: DepartmentUseCases
  ) {}

  public create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validated = createDepartmentSchema.parse(req.body);
      const context = getHrmsContext();

      const result = await this.createUseCase.execute(validated, context);
      if (result.isFailure) {
        return next(result.getError());
      }

      res.status(201).json(ApiResponseFactory.success(result.getValue()));
    } catch (err) {
      next(err);
    }
  };

  public list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();

      // Check if client requested tree format (?tree=true)
      if (req.query.tree === 'true' && this.departmentUseCases) {
        const hierarchy = await this.departmentUseCases.getHierarchy(context.organizationId);
        res.status(200).json(ApiResponseFactory.success(hierarchy));
        return;
      }

      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;

      const result = await this.listUseCase.execute(
        {
          search: req.query.search as string | undefined,
          isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined,
          pagination: { page, limit },
        },
        context
      );

      if (result.isFailure) {
        return next(result.getError());
      }

      const paginated = result.getValue();
      res.status(200).json(
        ApiResponseFactory.success(paginated.items, {
          page: paginated.page,
          limit: paginated.limit,
          total: paginated.total,
          totalPages: paginated.totalPages,
        })
      );
    } catch (err) {
      next(err);
    }
  };

  public getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      if (!this.departmentUseCases) throw new Error('DepartmentUseCases not configured');
      const dept = await this.departmentUseCases.getById(context.organizationId, req.params.id!);
      res.status(200).json(ApiResponseFactory.success(dept));
    } catch (err) {
      next(err);
    }
  };

  public update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      if (!this.departmentUseCases) throw new Error('DepartmentUseCases not configured');
      const updated = await this.departmentUseCases.update(context.organizationId, req.params.id!, req.body);
      res.status(200).json(ApiResponseFactory.success(updated));
    } catch (err) {
      next(err);
    }
  };

  public delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      if (!this.departmentUseCases) throw new Error('DepartmentUseCases not configured');
      await this.departmentUseCases.delete(context.organizationId, req.params.id!);
      res.status(200).json(ApiResponseFactory.success(null));
    } catch (err) {
      next(err);
    }
  };

  public getHierarchy = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      if (!this.departmentUseCases) throw new Error('DepartmentUseCases not configured');
      const hierarchy = await this.departmentUseCases.getHierarchy(context.organizationId);
      res.status(200).json(ApiResponseFactory.success(hierarchy));
    } catch (err) {
      next(err);
    }
  };

  public getStats = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      if (!this.departmentUseCases) throw new Error('DepartmentUseCases not configured');
      const stats = await this.departmentUseCases.getStats(context.organizationId);
      res.status(200).json(ApiResponseFactory.success(stats));
    } catch (err) {
      next(err);
    }
  };

  public bulkCreate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      if (!this.departmentUseCases) throw new Error('DepartmentUseCases not configured');
      const items = Array.isArray(req.body) ? req.body : req.body.departments;
      const created = await this.departmentUseCases.bulkCreate(context.organizationId, items);
      res.status(201).json(ApiResponseFactory.success(created));
    } catch (err) {
      next(err);
    }
  };

  public getEmployees = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      if (!this.departmentUseCases) throw new Error('DepartmentUseCases not configured');
      const employees = await this.departmentUseCases.getEmployees(context.organizationId, req.params.id!);
      res.status(200).json(ApiResponseFactory.success(employees));
    } catch (err) {
      next(err);
    }
  };
}
