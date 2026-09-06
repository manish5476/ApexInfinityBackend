import { Request, Response, NextFunction } from 'express';
import { AttendanceUseCases } from '../../application/use-cases/AttendanceUseCases';
import { ApiResponseFactory } from '../../../../shared/contracts';
import { getHrmsContext } from './context.helper';

export class AttendanceRequestController {
  constructor(private readonly attendanceUseCases: AttendanceUseCases) {}

  public create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const result = await this.attendanceUseCases.createRequest(context.organizationId, {
        ...req.body,
        userId: req.body.userId || context.userId,
        date: new Date(req.body.date),
        requestedFirstIn: req.body.requestedFirstIn ? new Date(req.body.requestedFirstIn) : undefined,
        requestedLastOut: req.body.requestedLastOut ? new Date(req.body.requestedLastOut) : undefined,
      });
      res.status(201).json(ApiResponseFactory.success(result));
    } catch (err) {
      next(err);
    }
  };

  public list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const list = await this.attendanceUseCases.listRequests(context.organizationId, {
        userId: req.query.userId as string | undefined,
        status: req.query.status as string | undefined,
        type: req.query.type as string | undefined,
      });
      res.status(200).json(ApiResponseFactory.success(list));
    } catch (err) {
      next(err);
    }
  };

  public getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const result = await this.attendanceUseCases.getRequestById(context.organizationId, req.params.id!);
      res.status(200).json(ApiResponseFactory.success(result));
    } catch (err) {
      next(err);
    }
  };

  public getMyRequests = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const list = await this.attendanceUseCases.getMyAttendanceRequests(context.organizationId, context.userId);
      res.status(200).json(ApiResponseFactory.success(list));
    } catch (err) {
      next(err);
    }
  };

  public cancel = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const result = await this.attendanceUseCases.cancelRequest(context.organizationId, req.params.id!);
      res.status(200).json(ApiResponseFactory.success(result));
    } catch (err) {
      next(err);
    }
  };

  public getPendingApprovals = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const list = await this.attendanceUseCases.getPendingAttendanceApprovals(context.organizationId, context.userId);
      res.status(200).json(ApiResponseFactory.success(list));
    } catch (err) {
      next(err);
    }
  };

  public approve = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const result = await this.attendanceUseCases.approveAttendanceRequest(
        context.organizationId,
        req.params.id!,
        context.userId
      );
      res.status(200).json(ApiResponseFactory.success(result));
    } catch (err) {
      next(err);
    }
  };

  public reject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const result = await this.attendanceUseCases.rejectAttendanceRequest(
        context.organizationId,
        req.params.id!,
        context.userId,
        req.body.reason
      );
      res.status(200).json(ApiResponseFactory.success(result));
    } catch (err) {
      next(err);
    }
  };
}
