import { Request, Response, NextFunction } from 'express';
import { LeaveManagementUseCases } from '../../application/use-cases/LeaveManagementUseCases';
import { ApiResponseFactory } from '../../../../shared/contracts';
import { getHrmsContext } from './context.helper';

export class LeaveBalanceController {
  constructor(private readonly leaveUseCases: LeaveManagementUseCases) {}

  public getMyBalance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const balance = await this.leaveUseCases.getMyBalance(
        context.organizationId,
        context.userId,
        req.query.financialYear as string | undefined
      );
      res.status(200).json(ApiResponseFactory.success(balance));
    } catch (err) {
      next(err);
    }
  };

  public getReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const report = await this.leaveUseCases.getLeaveBalanceReport(
        context.organizationId,
        req.query.financialYear as string | undefined
      );
      res.status(200).json(ApiResponseFactory.success(report));
    } catch (err) {
      next(err);
    }
  };

  public getUtilizationTrends = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const trends = await this.leaveUseCases.getUtilizationTrends(context.organizationId);
      res.status(200).json(ApiResponseFactory.success(trends));
    } catch (err) {
      next(err);
    }
  };

  public initialize = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const result = await this.leaveUseCases.initializeBalance(context.organizationId, req.body);
      res.status(201).json(ApiResponseFactory.success(result));
    } catch (err) {
      next(err);
    }
  };

  public bulkInitialize = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const result = await this.leaveUseCases.bulkInitialize(context.organizationId, req.body);
      res.status(201).json(ApiResponseFactory.success(result));
    } catch (err) {
      next(err);
    }
  };

  public accrueMonthly = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const result = await this.leaveUseCases.accrueMonthly(
        context.organizationId,
        req.body.financialYear,
        req.body.amount !== undefined ? Number(req.body.amount) : undefined
      );
      res.status(200).json(ApiResponseFactory.success(result));
    } catch (err) {
      next(err);
    }
  };

  public list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const list = await this.leaveUseCases.listBalances(context.organizationId, {
        financialYear: req.query.financialYear as string | undefined,
        userId: req.query.userId as string | undefined,
      });
      res.status(200).json(ApiResponseFactory.success(list));
    } catch (err) {
      next(err);
    }
  };

  public getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const balance = await this.leaveUseCases.getBalanceById(context.organizationId, req.params.id!);
      res.status(200).json(ApiResponseFactory.success(balance));
    } catch (err) {
      next(err);
    }
  };

  public update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const result = await this.leaveUseCases.updateBalance(context.organizationId, req.params.id!, req.body);
      res.status(200).json(ApiResponseFactory.success(result));
    } catch (err) {
      next(err);
    }
  };
}
