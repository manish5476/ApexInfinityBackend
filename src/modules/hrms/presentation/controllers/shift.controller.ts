import { Request, Response, NextFunction } from 'express';
import { ShiftAndRosteringUseCases } from '../../application/use-cases/ShiftAndRosteringUseCases';
import { ApiResponseFactory } from '../../../../shared/contracts';
import { getHrmsContext } from './context.helper';

export class ShiftController {
  constructor(private readonly shiftUseCases: ShiftAndRosteringUseCases) {}

  public create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const result = await this.shiftUseCases.createShift(context.organizationId, req.body);
      res.status(201).json(ApiResponseFactory.success(result));
    } catch (err) {
      next(err);
    }
  };

  public list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const list = await this.shiftUseCases.listShifts(context.organizationId, {
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
      const result = await this.shiftUseCases.getShiftById(context.organizationId, req.params.id!);
      res.status(200).json(ApiResponseFactory.success(result));
    } catch (err) {
      next(err);
    }
  };

  public update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const result = await this.shiftUseCases.updateShift(context.organizationId, req.params.id!, req.body);
      res.status(200).json(ApiResponseFactory.success(result));
    } catch (err) {
      next(err);
    }
  };

  public delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      await this.shiftUseCases.deleteShift(context.organizationId, req.params.id!);
      res.status(200).json(ApiResponseFactory.success(null));
    } catch (err) {
      next(err);
    }
  };

  public clone = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const result = await this.shiftUseCases.cloneShift(context.organizationId, req.params.id!);
      res.status(201).json(ApiResponseFactory.success(result));
    } catch (err) {
      next(err);
    }
  };

  public calculateHours = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const result = await this.shiftUseCases.calculateHours(context.organizationId, req.body);
      res.status(200).json(ApiResponseFactory.success(result));
    } catch (err) {
      next(err);
    }
  };

  public getTimeline = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const result = await this.shiftUseCases.getTimeline(context.organizationId);
      res.status(200).json(ApiResponseFactory.success(result));
    } catch (err) {
      next(err);
    }
  };

  public getCoverage = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const result = await this.shiftUseCases.getCoverage(context.organizationId);
      res.status(200).json(ApiResponseFactory.success(result));
    } catch (err) {
      next(err);
    }
  };

  public validateAssignment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const result = await this.shiftUseCases.validateAssignment(context.organizationId, req.body);
      res.status(200).json(ApiResponseFactory.success(result));
    } catch (err) {
      next(err);
    }
  };

  public getAssignments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const result = await this.shiftUseCases.getShiftAssignments(context.organizationId, req.params.id!);
      res.status(200).json(ApiResponseFactory.success(result));
    } catch (err) {
      next(err);
    }
  };
}
