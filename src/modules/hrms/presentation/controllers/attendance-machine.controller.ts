import { Request, Response, NextFunction } from 'express';
import { AttendanceUseCases } from '../../application/use-cases/AttendanceUseCases';
import { ApiResponseFactory } from '../../../../shared/contracts';
import { getHrmsContext } from './context.helper';

export class AttendanceMachineController {
  constructor(private readonly attendanceUseCases: AttendanceUseCases) {}

  public create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const result = await this.attendanceUseCases.createMachine(context.organizationId, req.body);
      res.status(201).json(ApiResponseFactory.success(result));
    } catch (err) {
      next(err);
    }
  };

  public list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const list = await this.attendanceUseCases.listMachines(context.organizationId, {
        status: req.query.status as string | undefined,
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
      const result = await this.attendanceUseCases.getMachineById(context.organizationId, req.params.id!);
      res.status(200).json(ApiResponseFactory.success(result));
    } catch (err) {
      next(err);
    }
  };

  public update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const result = await this.attendanceUseCases.updateMachine(context.organizationId, req.params.id!, req.body);
      res.status(200).json(ApiResponseFactory.success(result));
    } catch (err) {
      next(err);
    }
  };

  public delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      await this.attendanceUseCases.deleteMachine(context.organizationId, req.params.id!);
      res.status(200).json(ApiResponseFactory.success(null));
    } catch (err) {
      next(err);
    }
  };

  public ping = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.headers['x-organization-id'] as string || 'default';
      const result = await this.attendanceUseCases.pingMachine(orgId, req.params.id!);
      res.status(200).json(ApiResponseFactory.success(result));
    } catch (err) {
      next(err);
    }
  };

  public sync = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.headers['x-organization-id'] as string || 'default';
      const result = await this.attendanceUseCases.syncMachine(orgId, req.params.id!);
      res.status(200).json(ApiResponseFactory.success(result));
    } catch (err) {
      next(err);
    }
  };

  public testConnection = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const result = await this.attendanceUseCases.testConnection(context.organizationId, req.params.id!);
      res.status(200).json(ApiResponseFactory.success(result));
    } catch (err) {
      next(err);
    }
  };

  public regenerateApiKey = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const result = await this.attendanceUseCases.regenerateKey(context.organizationId, req.params.id!);
      res.status(200).json(ApiResponseFactory.success(result));
    } catch (err) {
      next(err);
    }
  };

  public mapUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const result = await this.attendanceUseCases.mapUser(
        context.organizationId,
        req.body.machineId,
        req.body.machineUserId,
        req.body.userId
      );
      res.status(200).json(ApiResponseFactory.success(result));
    } catch (err) {
      next(err);
    }
  };

  public bulkMapUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const result = await this.attendanceUseCases.bulkMapUsers(
        context.organizationId,
        req.body.machineId,
        req.body.mappings || []
      );
      res.status(200).json(ApiResponseFactory.success(result));
    } catch (err) {
      next(err);
    }
  };

  public bulkStatus = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const result = await this.attendanceUseCases.bulkStatus(context.organizationId);
      res.status(200).json(ApiResponseFactory.success(result));
    } catch (err) {
      next(err);
    }
  };

  public getAnalytics = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const analytics = await this.attendanceUseCases.getAnalytics(context.organizationId);
      res.status(200).json(ApiResponseFactory.success(analytics));
    } catch (err) {
      next(err);
    }
  };

  public getStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const status = await this.attendanceUseCases.getStatus(context.organizationId, req.params.id!);
      res.status(200).json(ApiResponseFactory.success(status));
    } catch (err) {
      next(err);
    }
  };

  public getLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const logs = await this.attendanceUseCases.getMachineLogs(context.organizationId, req.params.id!);
      res.status(200).json(ApiResponseFactory.success(logs));
    } catch (err) {
      next(err);
    }
  };

  public getUnmappedUsers = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const unmapped = await this.attendanceUseCases.getUnmappedUsers(context.organizationId);
      res.status(200).json(ApiResponseFactory.success(unmapped));
    } catch (err) {
      next(err);
    }
  };
}
