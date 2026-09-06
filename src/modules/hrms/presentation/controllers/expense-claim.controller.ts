import { Request, Response, NextFunction } from 'express';
import { PayrollAndExpensesUseCases } from '../../application/use-cases/PayrollAndExpensesUseCases';
import { ApiResponseFactory } from '../../../../shared/contracts';
import { getHrmsContext } from './context.helper';

export class ExpenseClaimController {
  constructor(private readonly payrollUseCases: PayrollAndExpensesUseCases) {}

  public create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const result = await this.payrollUseCases.createExpenseClaim(context.organizationId, {
        ...req.body,
        userId: req.body.userId || context.userId,
      });
      res.status(201).json(ApiResponseFactory.success(result));
    } catch (err) {
      next(err);
    }
  };

  public list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const list = await this.payrollUseCases.listExpenseClaims(context.organizationId, {
        userId: req.query.userId as string | undefined,
        status: req.query.status as string | undefined,
        category: req.query.category as string | undefined,
        branchId: req.query.branchId as string | undefined,
      });
      res.status(200).json(ApiResponseFactory.success(list));
    } catch (err) {
      next(err);
    }
  };

  public getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const result = await this.payrollUseCases.getExpenseClaimById(context.organizationId, req.params.id!);
      res.status(200).json(ApiResponseFactory.success(result));
    } catch (err) {
      next(err);
    }
  };

  public update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const result = await this.payrollUseCases.updateExpenseClaim(context.organizationId, req.params.id!, req.body);
      res.status(200).json(ApiResponseFactory.success(result));
    } catch (err) {
      next(err);
    }
  };

  public delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      await this.payrollUseCases.deleteExpenseClaim(context.organizationId, req.params.id!);
      res.status(200).json(ApiResponseFactory.success(null));
    } catch (err) {
      next(err);
    }
  };

  public approve = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const result = await this.payrollUseCases.approveExpenseClaim(
        context.organizationId,
        req.params.id!,
        context.userId,
        req.body.approvedAmount !== undefined ? Number(req.body.approvedAmount) : undefined,
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
      const result = await this.payrollUseCases.rejectExpenseClaim(
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
}
