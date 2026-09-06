import { Request, Response, NextFunction } from 'express';
import { AttendanceUseCases } from '../../application/use-cases/AttendanceUseCases';
import { ApiResponseFactory } from '../../../../shared/contracts';
import { getHrmsContext } from './context.helper';

export class AttendanceDailyController {
  constructor(private readonly attendanceUseCases: AttendanceUseCases) {}

  public list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const list = await this.attendanceUseCases.listDaily(context.organizationId, {
        employeeId: req.query.employeeId as string | undefined,
        shiftId: req.query.shiftId as string | undefined,
        status: req.query.status as string | undefined,
        date: req.query.date ? new Date(req.query.date as string) : undefined,
        from: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        to: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      });
      res.status(200).json(ApiResponseFactory.success(list));
    } catch (err) {
      next(err);
    }
  };

  public getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const result = await this.attendanceUseCases.getDailyById(context.organizationId, req.params.id!);
      res.status(200).json(ApiResponseFactory.success(result));
    } catch (err) {
      next(err);
    }
  };

  public getMyAttendance = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const list = await this.attendanceUseCases.getMyDailyAttendance(context.organizationId, context.userId);
      res.status(200).json(ApiResponseFactory.success(list));
    } catch (err) {
      next(err);
    }
  };

  public getToday = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const list = await this.attendanceUseCases.getTodayAttendance(context.organizationId);
      res.status(200).json(ApiResponseFactory.success(list));
    } catch (err) {
      next(err);
    }
  };

  public getDashboard = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const dashboard = await this.attendanceUseCases.getDashboard(context.organizationId);
      res.status(200).json(ApiResponseFactory.success(dashboard));
    } catch (err) {
      next(err);
    }
  };

  public getReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const from = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const to = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      const report = await this.attendanceUseCases.getReport(context.organizationId, from, to);
      res.status(200).json(ApiResponseFactory.success(report));
    } catch (err) {
      next(err);
    }
  };

  public getTrends = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const trends = await this.attendanceUseCases.getTrends(context.organizationId);
      res.status(200).json(ApiResponseFactory.success(trends));
    } catch (err) {
      next(err);
    }
  };

  public exportData = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const from = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const to = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      const list = await this.attendanceUseCases.exportDaily(context.organizationId, from, to);
      res.status(200).json(ApiResponseFactory.success(list));
    } catch (err) {
      next(err);
    }
  };

  public recalculate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const result = await this.attendanceUseCases.recalculateDaily(
        context.organizationId,
        req.body.employeeId,
        new Date(req.body.date)
      );
      res.status(200).json(ApiResponseFactory.success(result));
    } catch (err) {
      next(err);
    }
  };

  public bulkUpdate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const updates = Array.isArray(req.body) ? req.body : req.body.updates || [];
      const result = await this.attendanceUseCases.bulkUpdateDaily(context.organizationId, updates);
      res.status(200).json(ApiResponseFactory.success(result));
    } catch (err) {
      next(err);
    }
  };

  public regularize = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const result = await this.attendanceUseCases.regularizeDaily(context.organizationId, req.params.id!, req.body);
      res.status(200).json(ApiResponseFactory.success(result));
    } catch (err) {
      next(err);
    }
  };
}
