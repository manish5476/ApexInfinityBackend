import { Request, Response, NextFunction } from 'express';
import { AttendanceUseCases } from '../../application/use-cases/AttendanceUseCases';
import { ApiResponseFactory } from '../../../../shared/contracts';
import { getHrmsContext } from './context.helper';

export class GeoFenceController {
  constructor(private readonly attendanceUseCases: AttendanceUseCases) {}

  public create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const result = await this.attendanceUseCases.createGeoFence(context.organizationId, req.body);
      res.status(201).json(ApiResponseFactory.success(result));
    } catch (err) {
      next(err);
    }
  };

  public list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const list = await this.attendanceUseCases.listGeoFences(context.organizationId, {
        isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined,
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
      const result = await this.attendanceUseCases.getGeoFenceById(context.organizationId, req.params.id!);
      res.status(200).json(ApiResponseFactory.success(result));
    } catch (err) {
      next(err);
    }
  };

  public update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const result = await this.attendanceUseCases.updateGeoFence(context.organizationId, req.params.id!, req.body);
      res.status(200).json(ApiResponseFactory.success(result));
    } catch (err) {
      next(err);
    }
  };

  public delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      await this.attendanceUseCases.deleteGeoFence(context.organizationId, req.params.id!);
      res.status(200).json(ApiResponseFactory.success(null));
    } catch (err) {
      next(err);
    }
  };

  public findNearby = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const result = await this.attendanceUseCases.getNearby(
        context.organizationId,
        Number(req.body.latitude),
        Number(req.body.longitude)
      );
      res.status(200).json(ApiResponseFactory.success(result));
    } catch (err) {
      next(err);
    }
  };

  public checkPoint = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const result = await this.attendanceUseCases.checkPoint(
        context.organizationId,
        req.params.id!,
        Number(req.body.latitude),
        Number(req.body.longitude)
      );
      res.status(200).json(ApiResponseFactory.success(result));
    } catch (err) {
      next(err);
    }
  };

  public getViolations = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const violations = await this.attendanceUseCases.getViolations(context.organizationId);
      res.status(200).json(ApiResponseFactory.success(violations));
    } catch (err) {
      next(err);
    }
  };

  public getStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const stats = await this.attendanceUseCases.getGeoFenceStats(context.organizationId, req.params.id!);
      res.status(200).json(ApiResponseFactory.success(stats));
    } catch (err) {
      next(err);
    }
  };

  public assignUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const result = await this.attendanceUseCases.assignGeoFenceUsers(
        context.organizationId,
        req.params.id!,
        req.body.userIds || []
      );
      res.status(200).json(ApiResponseFactory.success(result));
    } catch (err) {
      next(err);
    }
  };

  public assignDepartments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const result = await this.attendanceUseCases.assignGeoFenceDepartments(
        context.organizationId,
        req.params.id!,
        req.body.departmentIds || []
      );
      res.status(200).json(ApiResponseFactory.success(result));
    } catch (err) {
      next(err);
    }
  };
}
