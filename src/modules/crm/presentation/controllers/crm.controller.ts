import { Request, Response, NextFunction } from 'express';
import { CreateCustomerUseCase } from '../../application/use-cases/CreateCustomerUseCase';
import { ListCustomersUseCase } from '../../application/use-cases/ListCustomersUseCase';
import { GetCustomerByIdUseCase } from '../../application/use-cases/GetCustomerByIdUseCase';
import { UpdateCustomerUseCase } from '../../application/use-cases/UpdateCustomerUseCase';
import { DeleteCustomerUseCase } from '../../application/use-cases/DeleteCustomerUseCase';
import { RestoreCustomerUseCase } from '../../application/use-cases/RestoreCustomerUseCase';
import { UpdateCreditLimitUseCase } from '../../application/use-cases/UpdateCreditLimitUseCase';
import { AddGuarantorUseCase } from '../../application/use-cases/AddGuarantorUseCase';
import { RemoveGuarantorUseCase } from '../../application/use-cases/RemoveGuarantorUseCase';
import { GetGuaranteedCustomersUseCase } from '../../application/use-cases/GetGuaranteedCustomersUseCase';
import { SearchCustomersUseCase } from '../../application/use-cases/SearchCustomersUseCase';
import { CheckDuplicateCustomerUseCase } from '../../application/use-cases/CheckDuplicateCustomerUseCase';
import { CreateLeadUseCase } from '../../application/use-cases/CreateLeadUseCase';
import { ConvertLeadUseCase } from '../../application/use-cases/ConvertLeadUseCase';
import { CreateOpportunityUseCase } from '../../application/use-cases/CreateOpportunityUseCase';
import { UpdateOpportunityStageUseCase } from '../../application/use-cases/UpdateOpportunityStageUseCase';
import { ListOpportunitiesUseCase } from '../../application/use-cases/ListOpportunitiesUseCase';
import { RequestContextHolder } from '../../../../middleware/requestContext.middleware';
import { DomainError } from '../../../../shared/errors';
import {
  createCustomerSchema,
  updateCustomerSchema,
  customerIdParamSchema,
  updateCreditLimitSchema,
  addGuarantorSchema,
  removeGuarantorSchema,
  createLeadSchema,
  convertLeadSchema,
  createOpportunitySchema,
  updateOpportunityStageSchema,
} from '../validators/crm.validator';

export class CrmController {
  constructor(
    private readonly createCustomerUseCase: CreateCustomerUseCase,
    private readonly listCustomersUseCase: ListCustomersUseCase,
    private readonly getCustomerByIdUseCase: GetCustomerByIdUseCase,
    private readonly updateCustomerUseCase: UpdateCustomerUseCase,
    private readonly deleteCustomerUseCase: DeleteCustomerUseCase,
    private readonly restoreCustomerUseCase: RestoreCustomerUseCase,
    private readonly updateCreditLimitUseCase: UpdateCreditLimitUseCase,
    private readonly addGuarantorUseCase: AddGuarantorUseCase,
    private readonly removeGuarantorUseCase: RemoveGuarantorUseCase,
    private readonly getGuaranteedCustomersUseCase: GetGuaranteedCustomersUseCase,
    private readonly searchCustomersUseCase: SearchCustomersUseCase,
    private readonly checkDuplicateCustomerUseCase: CheckDuplicateCustomerUseCase,
    private readonly createLeadUseCase: CreateLeadUseCase,
    private readonly convertLeadUseCase: ConvertLeadUseCase,
    private readonly createOpportunityUseCase: CreateOpportunityUseCase,
    private readonly updateOpportunityStageUseCase: UpdateOpportunityStageUseCase,
    private readonly listOpportunitiesUseCase: ListOpportunitiesUseCase
  ) {}

  public createCustomer = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = createCustomerSchema.parse({ body: req.body }).body;
      const context = RequestContextHolder.get()!;
      const result = await this.createCustomerUseCase.execute(validated, { organizationId: context.organizationId! });
      res.status(201).json({ status: 'success', data: result });
    } catch (err) {
      next(err instanceof Error ? new DomainError(err.message) : err);
    }
  };

  public listCustomers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const context = RequestContextHolder.get()!;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
      const search = (req.query.search || req.query.q) as string | undefined;
      const status = req.query.status as any;
      const isActive = req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined;

      const result = await this.listCustomersUseCase.execute(
        { page, limit, search, status, isActive },
        { organizationId: context.organizationId! }
      );
      res.status(200).json({ status: 'success', data: result.data, total: result.total, page, limit });
    } catch (err) {
      next(err);
    }
  };

  public getCustomerById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = customerIdParamSchema.parse({ params: req.params }).params;
      const context = RequestContextHolder.get()!;
      const result = await this.getCustomerByIdUseCase.execute(
        { id, populateGuarantors: false },
        { organizationId: context.organizationId! }
      );
      res.status(200).json({ status: 'success', ...result });
    } catch (err) {
      next(err instanceof Error ? new DomainError(err.message) : err);
    }
  };

  public getCustomerWithGuarantors = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = customerIdParamSchema.parse({ params: req.params }).params;
      const context = RequestContextHolder.get()!;
      const result = await this.getCustomerByIdUseCase.execute(
        { id, populateGuarantors: true },
        { organizationId: context.organizationId! }
      );
      res.status(200).json({ status: 'success', ...result });
    } catch (err) {
      next(err instanceof Error ? new DomainError(err.message) : err);
    }
  };

  public updateCustomer = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { params, body } = updateCustomerSchema.parse({ params: req.params, body: req.body });
      const context = RequestContextHolder.get()!;
      const result = await this.updateCustomerUseCase.execute(
        { id: params.id, data: body },
        { organizationId: context.organizationId! }
      );
      res.status(200).json({ status: 'success', data: { customer: result } });
    } catch (err) {
      next(err instanceof Error ? new DomainError(err.message) : err);
    }
  };

  public deleteCustomer = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = customerIdParamSchema.parse({ params: req.params }).params;
      const context = RequestContextHolder.get()!;
      const result = await this.deleteCustomerUseCase.execute({ id }, { organizationId: context.organizationId! });
      res.status(200).json({ status: 'success', message: result.message });
    } catch (err) {
      next(err instanceof Error ? new DomainError(err.message) : err);
    }
  };

  public restoreCustomer = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = customerIdParamSchema.parse({ params: req.params }).params;
      const context = RequestContextHolder.get()!;
      const result = await this.restoreCustomerUseCase.execute({ id }, { organizationId: context.organizationId! });
      res.status(200).json({ status: 'success', data: { customer: result } });
    } catch (err) {
      next(err instanceof Error ? new DomainError(err.message) : err);
    }
  };

  public updateCreditLimit = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { params, body } = updateCreditLimitSchema.parse({ params: req.params, body: req.body });
      const context = RequestContextHolder.get()!;
      const result = await this.updateCreditLimitUseCase.execute(
        { id: params.id, creditLimit: body.creditLimit },
        { organizationId: context.organizationId! }
      );
      res.status(200).json({
        status: 'success',
        ...(result.warning && { warning: result.warning }),
        data: { customer: result.customer },
      });
    } catch (err) {
      next(err instanceof Error ? new DomainError(err.message) : err);
    }
  };

  public addGuarantor = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { params, body } = addGuarantorSchema.parse({ params: req.params, body: req.body });
      const context = RequestContextHolder.get()!;
      const result = await this.addGuarantorUseCase.execute(
        { customerId: params.id, guarantorId: body.guarantorId, notes: body.notes, addedBy: context.userId },
        { organizationId: context.organizationId! }
      );
      res.status(200).json({ status: 'success', message: result.message, data: { customer: result.customer } });
    } catch (err) {
      next(err instanceof Error ? new DomainError(err.message) : err);
    }
  };

  public removeGuarantor = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { params } = removeGuarantorSchema.parse({ params: req.params });
      const context = RequestContextHolder.get()!;
      const result = await this.removeGuarantorUseCase.execute(
        { customerId: params.id, guarantorId: params.guarantorId },
        { organizationId: context.organizationId! }
      );
      res.status(200).json({ status: 'success', message: result.message, data: { customer: result.customer } });
    } catch (err) {
      next(err instanceof Error ? new DomainError(err.message) : err);
    }
  };

  public getGuaranteedCustomers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = customerIdParamSchema.parse({ params: req.params }).params;
      const context = RequestContextHolder.get()!;
      const result = await this.getGuaranteedCustomersUseCase.execute(
        { guarantorId: id },
        { organizationId: context.organizationId! }
      );
      res.status(200).json({ status: 'success', results: result.count, data: { guaranteedCustomers: result.guaranteedCustomers } });
    } catch (err) {
      next(err instanceof Error ? new DomainError(err.message) : err);
    }
  };

  public searchCustomers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = ((req.query.q || req.query.search || req.query.query || '') as string).trim();
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const context = RequestContextHolder.get()!;
      const result = await this.searchCustomersUseCase.execute(
        { query, limit },
        { organizationId: context.organizationId! }
      );
      res.status(200).json({ status: 'success', results: result.count, data: { customers: result.customers } });
    } catch (err) {
      next(err);
    }
  };

  public checkDuplicate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const context = RequestContextHolder.get()!;
      const result = await this.checkDuplicateCustomerUseCase.execute(
        {
          email: req.query.email as string,
          phone: req.query.phone as string,
          gstNumber: req.query.gstNumber as string,
          name: req.query.name as string,
        },
        { organizationId: context.organizationId! }
      );
      res.status(200).json({ status: 'success', isDuplicate: result.isDuplicate, existingCustomer: result.existingCustomer });
    } catch (err) {
      next(err);
    }
  };

  public bulkUpdateCustomers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const updates = req.body;
      if (!Array.isArray(updates) || updates.length === 0) {
        throw new DomainError('Provide an array of customer updates.');
      }
      const context = RequestContextHolder.get()!;
      let modifiedCount = 0;
      for (const item of updates) {
        if (item._id && item.update) {
          await this.updateCustomerUseCase.execute(
            { id: item._id, data: item.update },
            { organizationId: context.organizationId! }
          );
          modifiedCount++;
        }
      }
      res.status(200).json({
        status: 'success',
        message: 'Bulk update complete',
        data: { matchedCount: updates.length, modifiedCount },
      });
    } catch (err) {
      next(err instanceof Error ? new DomainError(err.message) : err);
    }
  };

  public createLead = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = createLeadSchema.parse({ body: req.body }).body;
      const context = RequestContextHolder.get()!;
      const result = await this.createLeadUseCase.execute(validated, { organizationId: context.organizationId! });
      res.status(201).json({ status: 'success', data: result });
    } catch (err) {
      next(err);
    }
  };

  public convertLead = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = convertLeadSchema.parse({ params: req.params }).params;
      const context = RequestContextHolder.get()!;
      const result = await this.convertLeadUseCase.execute({ leadId: validated.leadId }, { organizationId: context.organizationId! });
      res.status(200).json({ status: 'success', data: result });
    } catch (err) {
      next(err instanceof Error ? new DomainError(err.message) : err);
    }
  };

  public createOpportunity = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = createOpportunitySchema.parse({ body: req.body }).body;
      const context = RequestContextHolder.get()!;
      const result = await this.createOpportunityUseCase.execute(validated, { organizationId: context.organizationId! });
      res.status(201).json({ status: 'success', data: result });
    } catch (err) {
      next(err instanceof Error ? new DomainError(err.message) : err);
    }
  };

  public updateOpportunityStage = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { params, body } = updateOpportunityStageSchema.parse({ params: req.params, body: req.body });
      const context = RequestContextHolder.get()!;
      const result = await this.updateOpportunityStageUseCase.execute(
        { id: params.id, stage: body.stage },
        { organizationId: context.organizationId! }
      );
      res.status(200).json({ status: 'success', data: result });
    } catch (err) {
      next(err instanceof Error ? new DomainError(err.message) : err);
    }
  };

  public listOpportunities = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const context = RequestContextHolder.get()!;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
      const customerId = req.query.customerId as string | undefined;
      const stage = req.query.stage as string | undefined;

      const result = await this.listOpportunitiesUseCase.execute(
        { page, limit, customerId, stage },
        { organizationId: context.organizationId! }
      );
      res.status(200).json({ status: 'success', data: result.data, total: result.total, page, limit });
    } catch (err) {
      next(err);
    }
  };
}

