import { Request, Response, NextFunction } from 'express';
import { ShiftAndRosteringUseCases } from '../../application/use-cases/ShiftAndRosteringUseCases';
import { ApiResponseFactory } from '../../../../shared/contracts';
import { getHrmsContext } from './context.helper';

export class ShiftGroupController {
  constructor(private readonly shiftUseCases: ShiftAndRosteringUseCases) {}

  public create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const result = await this.shiftUseCases.createShiftGroup(context.organizationId, req.body);
      res.status(201).json(ApiResponseFactory.success(result));
    } catch (err) {
      next(err);
    }
  };

  public list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const list = await this.shiftUseCases.listShiftGroups(context.organizationId, {
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
      const result = await this.shiftUseCases.getShiftGroupById(context.organizationId, req.params.id!);
      res.status(200).json(ApiResponseFactory.success(result));
    } catch (err) {
      next(err);
    }
  };

  public update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const result = await this.shiftUseCases.updateShiftGroup(context.organizationId, req.params.id!, req.body);
      res.status(200).json(ApiResponseFactory.success(result));
    } catch (err) {
      next(err);
    }
  };

  public delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      await this.shiftUseCases.deleteShiftGroup(context.organizationId, req.params.id!);
      res.status(200).json(ApiResponseFactory.success(null));
    } catch (err) {
      next(err);
    }
  };

  public generateSchedule = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const result = await this.shiftUseCases.generateSchedule(context.organizationId, req.params.id!, {
        startDate: new Date(req.body.startDate),
        endDate: new Date(req.body.endDate),
        userIds: req.body.userIds,
      });
      res.status(200).json(ApiResponseFactory.success(result));
    } catch (err) {
      next(err);
    }
  };

  public assign = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const result = await this.shiftUseCases.assignShiftGroup(context.organizationId, req.params.id!, {
        userIds: req.body.userIds,
        startDate: new Date(req.body.startDate),
        endDate: req.body.endDate ? new Date(req.body.endDate) : undefined,
      });
      res.status(200).json(ApiResponseFactory.success(result));
    } catch (err) {
      next(err);
    }
  };

  public getAssignments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const result = await this.shiftUseCases.getShiftGroupAssignments(context.organizationId, req.params.id!);
      res.status(200).json(ApiResponseFactory.success(result));
    } catch (err) {
      next(err);
    }
  };
}
