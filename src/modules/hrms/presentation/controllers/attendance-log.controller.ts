import { Request, Response, NextFunction } from 'express';
import { AttendanceUseCases } from '../../application/use-cases/AttendanceUseCases';
import { ApiResponseFactory } from '../../../../shared/contracts';
import { getHrmsContext } from './context.helper';

export class AttendanceLogController {
  constructor(private readonly attendanceUseCases: AttendanceUseCases) {}

  public create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const result = await this.attendanceUseCases.createLog(context.organizationId, {
        ...req.body,
        userId: req.body.userId || context.userId,
        timestamp: req.body.timestamp ? new Date(req.body.timestamp) : new Date(),
      });
      res.status(201).json(ApiResponseFactory.success(result));
    } catch (err) {
      next(err);
    }
  };

  public bulkCreate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const logs = Array.isArray(req.body) ? req.body : req.body.logs || [];
      const result = await this.attendanceUseCases.bulkCreateLogs(context.organizationId, logs);
      res.status(201).json(ApiResponseFactory.success(result));
    } catch (err) {
      next(err);
    }
  };

  public list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const list = await this.attendanceUseCases.listLogs(context.organizationId, {
        userId: req.query.userId as string | undefined,
        machineId: req.query.machineId as string | undefined,
        type: req.query.type as string | undefined,
        source: req.query.source as string | undefined,
        isVerified: req.query.isVerified !== undefined ? req.query.isVerified === 'true' : undefined,
        isFlagged: req.query.isFlagged !== undefined ? req.query.isFlagged === 'true' : undefined,
      });
      res.status(200).json(ApiResponseFactory.success(list));
    } catch (err) {
      next(err);
    }
  };

  public getMyLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const from = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const to = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      const list = await this.attendanceUseCases.getMyLogs(context.organizationId, context.userId, from, to);
      res.status(200).json(ApiResponseFactory.success(list));
    } catch (err) {
      next(err);
    }
  };

  public getUserLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const list = await this.attendanceUseCases.getUserLogs(context.organizationId, req.params.userId!);
      res.status(200).json(ApiResponseFactory.success(list));
    } catch (err) {
      next(err);
    }
  };

  public getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const result = await this.attendanceUseCases.getLogById(context.organizationId, req.params.id!);
      res.status(200).json(ApiResponseFactory.success(result));
    } catch (err) {
      next(err);
    }
  };

  public getStats = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const stats = await this.attendanceUseCases.getLogStats(context.organizationId);
      res.status(200).json(ApiResponseFactory.success(stats));
    } catch (err) {
      next(err);
    }
  };

  public getRealtimeFeed = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const feed = await this.attendanceUseCases.getRealtimeFeed(context.organizationId);
      res.status(200).json(ApiResponseFactory.success(feed));
    } catch (err) {
      next(err);
    }
  };

  public verify = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const result = await this.attendanceUseCases.verifyLog(context.organizationId, req.params.id!, context.userId);
      res.status(200).json(ApiResponseFactory.success(result));
    } catch (err) {
      next(err);
    }
  };

  public flag = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const result = await this.attendanceUseCases.flagLog(
        context.organizationId,
        req.params.id!,
        req.body.reason || 'Flagged manually',
        context.userId
      );
      res.status(200).json(ApiResponseFactory.success(result));
    } catch (err) {
      next(err);
    }
  };

  public correct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const result = await this.attendanceUseCases.correctLog(context.organizationId, req.params.id!, {
        notes: req.body.notes || 'Corrected manually',
        correctedBy: context.userId,
        timestamp: req.body.timestamp ? new Date(req.body.timestamp) : undefined,
        type: req.body.type,
      });
      res.status(200).json(ApiResponseFactory.success(result));
    } catch (err) {
      next(err);
    }
  };
}
