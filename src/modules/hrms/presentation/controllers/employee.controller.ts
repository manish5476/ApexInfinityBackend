import { Request, Response, NextFunction } from 'express';
import { CreateEmployeeUseCase } from '../../application/use-cases/CreateEmployeeUseCase';
import { GetEmployeeByIdUseCase } from '../../application/use-cases/GetEmployeeByIdUseCase';
import { ListEmployeesUseCase } from '../../application/use-cases/ListEmployeesUseCase';
import { UpdateEmployeeUseCase } from '../../application/use-cases/UpdateEmployeeUseCase';
import { createEmployeeSchema, updateEmployeeSchema } from '../validators/employee.validator';
import { ApiResponseFactory } from '../../../../shared/contracts';
import { getHrmsContext } from './context.helper';
import { ValidationError } from '../../../../shared/errors';

import { EmployeeExtendedUseCases } from '../../application/use-cases/EmployeeExtendedUseCases';

export class EmployeeController {
  private readonly createEmployeeUseCase: CreateEmployeeUseCase;
  private readonly getEmployeeByIdUseCase: GetEmployeeByIdUseCase;
  private readonly listEmployeesUseCase: ListEmployeesUseCase;
  private readonly updateEmployeeUseCase: UpdateEmployeeUseCase;
  private readonly employeeExtendedUseCases?: EmployeeExtendedUseCases;

  constructor(
    createEmployeeUseCase: CreateEmployeeUseCase,
    getEmployeeByIdUseCase: GetEmployeeByIdUseCase,
    listEmployeesUseCase: ListEmployeesUseCase,
    updateEmployeeUseCase: UpdateEmployeeUseCase,
    employeeExtendedUseCases?: EmployeeExtendedUseCases
  ) {
    this.createEmployeeUseCase = createEmployeeUseCase;
    this.getEmployeeByIdUseCase = getEmployeeByIdUseCase;
    this.listEmployeesUseCase = listEmployeesUseCase;
    this.updateEmployeeUseCase = updateEmployeeUseCase;
    this.employeeExtendedUseCases = employeeExtendedUseCases;
  }

  public create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validated = createEmployeeSchema.parse(req.body);
      const context = getHrmsContext();

      const result = await this.createEmployeeUseCase.execute(validated, context);
      if (result.isFailure) {
        return next(result.getError());
      }

      res.status(201).json(ApiResponseFactory.success(result.getValue()));
    } catch (err) {
      next(err);
    }
  };

  public getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id;
      if (!id) {
        throw new ValidationError('Employee ID is required.');
      }
      const context = getHrmsContext();

      const result = await this.getEmployeeByIdUseCase.execute({ employeeId: id }, context);
      if (result.isFailure) {
        return next(result.getError());
      }

      res.status(200).json(ApiResponseFactory.success(result.getValue()));
    } catch (err) {
      next(err);
    }
  };

  public list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

      const result = await this.listEmployeesUseCase.execute(
        {
          departmentId: req.query.departmentId as string | undefined,
          designationId: req.query.designationId as string | undefined,
          status: req.query.status as string | undefined,
          workMode: req.query.workMode as string | undefined,
          search: req.query.search as string | undefined,
          pagination: { page, limit },
        },
        context
      );

      if (result.isFailure) {
        return next(result.getError());
      }

      const paginated = result.getValue();
      res.status(200).json(
        ApiResponseFactory.success(paginated.items, {
          page: paginated.page,
          limit: paginated.limit,
          total: paginated.total,
          totalPages: paginated.totalPages,
        })
      );
    } catch (err) {
      next(err);
    }
  };

  public update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id;
      if (!id) {
        throw new ValidationError('Employee ID is required.');
      }
      const validated = updateEmployeeSchema.parse(req.body);
      const context = getHrmsContext();

      const result = await this.updateEmployeeUseCase.execute(
        {
          employeeId: id,
          data: validated,
        },
        context
      );

      if (result.isFailure) {
        return next(result.getError());
      }

      res.status(200).json(ApiResponseFactory.success(result.getValue()));
    } catch (err) {
      next(err);
    }
  };

  public getMyProfile = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      if (!this.employeeExtendedUseCases) throw new Error('EmployeeExtendedUseCases not configured');
      const profile = await this.employeeExtendedUseCases.getMyProfile(context.organizationId, context.userId);
      res.status(200).json(ApiResponseFactory.success(profile));
    } catch (err) {
      next(err);
    }
  };

  public getByUserId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      if (!this.employeeExtendedUseCases) throw new Error('EmployeeExtendedUseCases not configured');
      const emp = await this.employeeExtendedUseCases.getByUserId(context.organizationId, req.params.userId!);
      res.status(200).json(ApiResponseFactory.success(emp));
    } catch (err) {
      next(err);
    }
  };

  public getWorkspace360 = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      if (!this.employeeExtendedUseCases) throw new Error('EmployeeExtendedUseCases not configured');
      const workspace = await this.employeeExtendedUseCases.getWorkspace360(context.organizationId, req.params.id!);
      res.status(200).json(ApiResponseFactory.success(workspace));
    } catch (err) {
      next(err);
    }
  };

  public inviteUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      if (!this.employeeExtendedUseCases) throw new Error('EmployeeExtendedUseCases not configured');
      const result = await this.employeeExtendedUseCases.inviteUser(context.organizationId, req.params.id!, req.body);
      res.status(200).json(ApiResponseFactory.success(result));
    } catch (err) {
      next(err);
    }
  };

  public deactivate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = getHrmsContext();
      if (!this.employeeExtendedUseCases) throw new Error('EmployeeExtendedUseCases not configured');
      const result = await this.employeeExtendedUseCases.deactivate(context.organizationId, req.params.id!, req.body);
      res.status(200).json(ApiResponseFactory.success(result));
    } catch (err) {
      next(err);
    }
  };
}
