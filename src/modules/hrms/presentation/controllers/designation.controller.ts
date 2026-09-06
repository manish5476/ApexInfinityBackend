import { Request, Response, NextFunction } from 'express';
import { DesignationUseCases } from '../../application/use-cases/DesignationUseCases';
import { ApiResponseFactory } from '../../../../shared/contracts';
import { getHrmsContext } from './context.helper';

export class DesignationController {
  constructor(private readonly designationUseCases: DesignationUseCases) {}

  public create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const result = await this.designationUseCases.create(context.organizationId, req.body);
      res.status(201).json(ApiResponseFactory.success(result));
    } catch (err) {
      next(err);
    }
  };

  public list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const list = await this.designationUseCases.list(context.organizationId, {
        departmentId: req.query.departmentId as string | undefined,
        isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined,
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
      const result = await this.designationUseCases.getById(context.organizationId, req.params.id!);
      res.status(200).json(ApiResponseFactory.success(result));
    } catch (err) {
      next(err);
    }
  };

  public update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const result = await this.designationUseCases.update(context.organizationId, req.params.id!, req.body);
      res.status(200).json(ApiResponseFactory.success(result));
    } catch (err) {
      next(err);
    }
  };

  public delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      await this.designationUseCases.delete(context.organizationId, req.params.id!);
      res.status(200).json(ApiResponseFactory.success(null));
    } catch (err) {
      next(err);
    }
  };

  public getHierarchy = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const hierarchy = await this.designationUseCases.getHierarchy(context.organizationId);
      res.status(200).json(ApiResponseFactory.success(hierarchy));
    } catch (err) {
      next(err);
    }
  };

  public getCareerPath = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const path = await this.designationUseCases.getCareerPath(context.organizationId, req.params.id!);
      res.status(200).json(ApiResponseFactory.success(path));
    } catch (err) {
      next(err);
    }
  };

  public getSalaryBands = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const bands = await this.designationUseCases.getSalaryBands(context.organizationId);
      res.status(200).json(ApiResponseFactory.success(bands));
    } catch (err) {
      next(err);
    }
  };

  public getPromotionEligible = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const eligible = await this.designationUseCases.getPromotionEligible(context.organizationId);
      res.status(200).json(ApiResponseFactory.success(eligible));
    } catch (err) {
      next(err);
    }
  };

  public bulkCreate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const items = Array.isArray(req.body) ? req.body : req.body.designations;
      const created = await this.designationUseCases.bulkCreate(context.organizationId, items);
      res.status(201).json(ApiResponseFactory.success(created));
    } catch (err) {
      next(err);
    }
  };

  public getEmployees = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const employees = await this.designationUseCases.getEmployees(context.organizationId, req.params.id!);
      res.status(200).json(ApiResponseFactory.success(employees));
    } catch (err) {
      next(err);
    }
  };
}
