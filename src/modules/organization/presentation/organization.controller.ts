import { Request, Response, NextFunction } from 'express';
import { CreateOrganizationUseCase } from '../application/use-cases/CreateOrganizationUseCase';
import { GetOrganizationByIdUseCase } from '../application/use-cases/GetOrganizationByIdUseCase';
import { UpdateOrganizationUseCase } from '../application/use-cases/UpdateOrganizationUseCase';
import { GetMyOrganizationUseCase } from '../application/use-cases/GetMyOrganizationUseCase';
import { IOrganizationRepository } from '../domain/ports/IOrganizationRepository';
import { OrganizationMapper } from '../application/mappers/OrganizationMapper';
import { createOrganizationSchema } from './organization.validator';
import { ApiResponseFactory } from '../../../shared/contracts';
import { RequestContextHolder } from '../../../middleware/requestContext.middleware';
import { NotFoundError } from '../../../shared/errors';

export class OrganizationController {
  private readonly mapper = new OrganizationMapper();

  constructor(
    private readonly createUseCase: CreateOrganizationUseCase,
    private readonly getByIdUseCase: GetOrganizationByIdUseCase,
    private readonly updateUseCase: UpdateOrganizationUseCase,
    private readonly getMyOrgUseCase: GetMyOrganizationUseCase,
    private readonly orgRepo: IOrganizationRepository
  ) {}

  public create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validated = createOrganizationSchema.parse(req.body);
      const context = RequestContextHolder.get();

      const result = await this.createUseCase.execute(validated, context);
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
      const { id } = req.params;
      const context = RequestContextHolder.get();

      const result = await this.getByIdUseCase.execute(id as string, context);
      if (result.isFailure) {
        return next(result.getError());
      }

      res.status(200).json(ApiResponseFactory.success(result.getValue()));
    } catch (err) {
      next(err);
    }
  };

  public getMyOrganization = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = RequestContextHolder.get();
      const orgId = context?.organizationId;

      const result = await this.getMyOrgUseCase.execute({ organizationId: orgId });
      if (result.isFailure) {
        return next(result.getError());
      }

      res.status(200).json(ApiResponseFactory.success(this.mapper.toDto(result.getValue())));
    } catch (err) {
      next(err);
    }
  };

  public updateMyOrganization = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = RequestContextHolder.get();
      const orgId = context?.organizationId;
      if (!orgId) {
        return next(new NotFoundError('Organization not found in context.'));
      }

      const result = await this.updateUseCase.execute({ organizationId: orgId, ...req.body });
      if (result.isFailure) {
        return next(result.getError());
      }

      res.status(200).json(ApiResponseFactory.success(this.mapper.toDto(result.getValue())));
    } catch (err) {
      next(err);
    }
  };

  public update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const result = await this.updateUseCase.execute({ organizationId: id as string, ...req.body });
      if (result.isFailure) {
        return next(result.getError());
      }

      res.status(200).json(ApiResponseFactory.success(this.mapper.toDto(result.getValue())));
    } catch (err) {
      next(err);
    }
  };

  public getByShopId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { uniqueShopId } = req.params;
      const org = await this.orgRepo.findByShopId(uniqueShopId as string);
      if (!org) {
        return next(new NotFoundError(`Organization with shop ID '${uniqueShopId}' not found.`));
      }

      res.status(200).json(ApiResponseFactory.success(this.mapper.toDto(org)));
    } catch (err) {
      next(err);
    }
  };
}
