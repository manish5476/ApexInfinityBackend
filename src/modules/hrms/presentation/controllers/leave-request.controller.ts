import { Request, Response, NextFunction } from 'express';
import { LeaveManagementUseCases } from '../../application/use-cases/LeaveManagementUseCases';
import { ApiResponseFactory } from '../../../../shared/contracts';
import { getHrmsContext } from './context.helper';

export class LeaveRequestController {
  constructor(private readonly leaveUseCases: LeaveManagementUseCases) {}

  public create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const result = await this.leaveUseCases.createRequest(context.organizationId, {
        ...req.body,
        userId: req.body.userId || context.userId,
        startDate: new Date(req.body.startDate),
        endDate: new Date(req.body.endDate),
        daysCount: Number(req.body.daysCount),
      });
      res.status(201).json(ApiResponseFactory.success(result));
    } catch (err) {
      next(err);
    }
  };

  public list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const list = await this.leaveUseCases.listRequests(context.organizationId, {
        userId: req.query.userId as string | undefined,
        status: req.query.status as string | undefined,
        leaveType: req.query.leaveType as string | undefined,
        departmentId: req.query.departmentId as string | undefined,
      });
      res.status(200).json(ApiResponseFactory.success(list));
    } catch (err) {
      next(err);
    }
  };

  public getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const result = await this.leaveUseCases.getRequestById(context.organizationId, req.params.id!);
      res.status(200).json(ApiResponseFactory.success(result));
    } catch (err) {
      next(err);
    }
  };

  public update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const result = await this.leaveUseCases.updateRequest(context.organizationId, req.params.id!, {
        ...req.body,
        startDate: req.body.startDate ? new Date(req.body.startDate) : undefined,
        endDate: req.body.endDate ? new Date(req.body.endDate) : undefined,
        daysCount: req.body.daysCount !== undefined ? Number(req.body.daysCount) : undefined,
      });
      res.status(200).json(ApiResponseFactory.success(result));
    } catch (err) {
      next(err);
    }
  };

  public delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      await this.leaveUseCases.deleteRequest(context.organizationId, req.params.id!);
      res.status(200).json(ApiResponseFactory.success(null));
    } catch (err) {
      next(err);
    }
  };

  public getMyRequests = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const list = await this.leaveUseCases.getMyRequests(context.organizationId, context.userId);
      res.status(200).json(ApiResponseFactory.success(list));
    } catch (err) {
      next(err);
    }
  };

  public getBalanceSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const summary = await this.leaveUseCases.getBalanceSummary(
        context.organizationId,
        context.userId,
        req.query.financialYear as string | undefined
      );
      res.status(200).json(ApiResponseFactory.success(summary));
    } catch (err) {
      next(err);
    }
  };

  public getPendingApprovals = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const list = await this.leaveUseCases.getPendingApprovals(context.organizationId, context.userId);
      res.status(200).json(ApiResponseFactory.success(list));
    } catch (err) {
      next(err);
    }
  };

  public getTeamCalendar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const calendar = await this.leaveUseCases.getTeamCalendar(context.organizationId, req.query.departmentId as string | undefined);
      res.status(200).json(ApiResponseFactory.success(calendar));
    } catch (err) {
      next(err);
    }
  };

  public approve = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const result = await this.leaveUseCases.approveRequest(
        context.organizationId,
        req.params.id!,
        context.userId,
        req.body.comments
      );
      res.status(200).json(ApiResponseFactory.success(result));
    } catch (err) {
      next(err);
    }
  };

  public reject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const result = await this.leaveUseCases.rejectRequest(
        context.organizationId,
        req.params.id!,
        context.userId,
        req.body.comments
      );
      res.status(200).json(ApiResponseFactory.success(result));
    } catch (err) {
      next(err);
    }
  };

  public escalate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const result = await this.leaveUseCases.escalateRequest(
        context.organizationId,
        req.params.id!,
        req.body.escalatedTo,
        req.body.reason
      );
      res.status(200).json(ApiResponseFactory.success(result));
    } catch (err) {
      next(err);
    }
  };

  public bulkApprove = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const requestIds: string[] = req.body.requestIds || [];
      const result = await this.leaveUseCases.bulkApprove(context.organizationId, requestIds, context.userId);
      res.status(200).json(ApiResponseFactory.success(result));
    } catch (err) {
      next(err);
    }
  };

  public getAnalytics = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const analytics = await this.leaveUseCases.getLeaveAnalytics(context.organizationId);
      res.status(200).json(ApiResponseFactory.success(analytics));
    } catch (err) {
      next(err);
    }
  };
}
