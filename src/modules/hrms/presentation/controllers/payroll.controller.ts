import { Request, Response, NextFunction } from 'express';
import { PayrollAndExpensesUseCases } from '../../application/use-cases/PayrollAndExpensesUseCases';
import { ApiResponseFactory } from '../../../../shared/contracts';
import { getHrmsContext } from './context.helper';

export class PayrollController {
  constructor(private readonly payrollUseCases: PayrollAndExpensesUseCases) {}

  public runMonthlyPayroll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const result = await this.payrollUseCases.createPayrollRun(context.organizationId, {
        month: parseInt(req.body.month, 10),
        year: parseInt(req.body.year, 10),
        branchId: req.body.branchId,
        userIds: req.body.userIds,
      });
      res.status(201).json(ApiResponseFactory.success(result));
    } catch (err) {
      next(err);
    }
  };

  public bulkUpdateStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const result = await this.payrollUseCases.bulkUpdatePayslipsStatus(
        context.organizationId,
        req.body.payslipIds || [],
        req.body.status
      );
      res.status(200).json(ApiResponseFactory.success(result));
    } catch (err) {
      next(err);
    }
  };

  public getMyPayslips = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const list = await this.payrollUseCases.getMyPayslips(context.organizationId, context.userId);
      res.status(200).json(ApiResponseFactory.success(list));
    } catch (err) {
      next(err);
    }
  };

  public getPayslipList = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const list = await this.payrollUseCases.listPayslips(context.organizationId, {
        month: req.query.month ? parseInt(req.query.month as string, 10) : undefined,
        year: req.query.year ? parseInt(req.query.year as string, 10) : undefined,
        status: req.query.status as string | undefined,
        userId: req.query.userId as string | undefined,
        branchId: req.query.branchId as string | undefined,
      });
      res.status(200).json(ApiResponseFactory.success(list));
    } catch (err) {
      next(err);
    }
  };

  public getPayslip = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const result = await this.payrollUseCases.getPayslipById(context.organizationId, req.params.id!);
      res.status(200).json(ApiResponseFactory.success(result));
    } catch (err) {
      next(err);
    }
  };

  public updatePayslipStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const result = await this.payrollUseCases.updatePayslip(context.organizationId, req.params.id!, req.body);
      res.status(200).json(ApiResponseFactory.success(result));
    } catch (err) {
      next(err);
    }
  };
}
