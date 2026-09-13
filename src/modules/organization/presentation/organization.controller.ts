import { Request, Response, NextFunction } from 'express';
import { CreateOrganizationUseCase } from '../application/use-cases/CreateOrganizationUseCase';
import { GetOrganizationByIdUseCase } from '../application/use-cases/GetOrganizationByIdUseCase';
import { UpdateOrganizationUseCase } from '../application/use-cases/UpdateOrganizationUseCase';
import { GetMyOrganizationUseCase } from '../application/use-cases/GetMyOrganizationUseCase';
import { IOrganizationRepository } from '../domain/ports/IOrganizationRepository';
import { OrganizationMapper } from '../application/mappers/OrganizationMapper';
import { createOrganizationSchema, updateOrganizationSchema } from './organization.validator';
import { ApiResponseFactory } from '../../../shared/contracts';
import { RequestContextHolder } from '../../../middleware/requestContext.middleware';
import { NotFoundError, BadRequestError, ForbiddenError } from '../../../shared/errors';
import { IPasswordHasher } from '../../../infrastructure/security/IPasswordHasher';
import { AuthenticatedUser } from '../../../middleware/auth.middleware';
import { OrganizationMemberService } from '../infrastructure/services/OrganizationMemberService';

export class OrganizationController {
  private readonly mapper = new OrganizationMapper();

  constructor(
    private readonly createUseCase: CreateOrganizationUseCase,
    private readonly getByIdUseCase: GetOrganizationByIdUseCase,
    private readonly updateUseCase: UpdateOrganizationUseCase,
    private readonly getMyOrgUseCase: GetMyOrganizationUseCase,
    private readonly orgRepo: IOrganizationRepository,
    private readonly memberService: OrganizationMemberService,
    private readonly passwordHasher: IPasswordHasher
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
      if (!orgId) {
        return next(new NotFoundError('Organization not found in context.'));
      }

      const result = await this.getMyOrgUseCase.execute({ organizationId: orgId });
      if (result.isFailure) {
        return next(result.getError());
      }

      const members = await this.memberService.getMembers(orgId);

      res.status(200).json(ApiResponseFactory.success({
        ...this.mapper.toDto(result.getValue()),
        members,
      }));
    } catch (err) {
      next(err);
    }
  };

  public updateMyOrganization = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = RequestContextHolder.get();
      const orgId = context?.organizationId;
      const user = (req as unknown as { user: AuthenticatedUser }).user;

      if (!orgId) {
        return next(new NotFoundError('Organization not found in context.'));
      }

      if ((req.body.uniqueShopId || req.body.gstNumber) && (!user || !user.roles.includes('owner'))) {
        return next(new ForbiddenError('Only owner can change uniqueShopId or gstNumber'));
      }

      const validated = updateOrganizationSchema.parse(req.body);
      const result = await this.updateUseCase.execute({ organizationId: orgId, ...validated });
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

  public lookupOrganizations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email } = req.body;
      if (!email) {
        return next(new BadRequestError('Email is required'));
      }

      const organizations = await this.memberService.lookupOrganizationsByEmail(email, this.orgRepo);
      res.status(200).json(ApiResponseFactory.success({ organizations, message: 'Organizations fetched successfully' }));
    } catch (err) {
      next(err);
    }
  };

  public getPendingMembers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = RequestContextHolder.get();
      const orgId = context?.organizationId;
      if (!orgId) {
        return next(new NotFoundError('Organization not found in context.'));
      }

      const pendingUsers = await this.memberService.getPendingMembers(orgId);
      res.status(200).json(ApiResponseFactory.success(pendingUsers));
    } catch (err) {
      next(err);
    }
  };

  public approveMember = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId, roleId, branchId } = req.body;
      const context = RequestContextHolder.get();
      const orgId = context?.organizationId;

      if (!userId || !roleId || !branchId) {
        return next(new BadRequestError('userId, roleId, and branchId are required'));
      }
      if (!orgId) {
        return next(new NotFoundError('Organization not found in context.'));
      }

      const user = await this.memberService.approveMember(orgId, userId, roleId, branchId);
      res.status(200).json(ApiResponseFactory.success(user));
    } catch (err) {
      next(err);
    }
  };

  public rejectMember = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = req.body;
      const context = RequestContextHolder.get();
      const orgId = context?.organizationId;

      if (!userId) {
        return next(new BadRequestError('userId is required'));
      }
      if (!orgId) {
        return next(new NotFoundError('Organization not found in context.'));
      }

      await this.memberService.rejectMember(orgId, userId);
      res.status(200).json(ApiResponseFactory.success({ message: 'Member request rejected successfully' }));
    } catch (err) {
      next(err);
    }
  };

  public deleteMyOrganization = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = RequestContextHolder.get();
      const orgId = context?.organizationId;
      const user = (req as unknown as { user: AuthenticatedUser }).user;

      if (!orgId) {
        return next(new NotFoundError('Organization not found in context.'));
      }

      const org = await this.orgRepo.findById(orgId);
      if (!org) {
        return next(new NotFoundError('Organization not found.'));
      }

      if (!user?.roles.includes('owner')) {
        return next(new ForbiddenError('Only owner can delete the organization'));
      }

      await this.orgRepo.delete(orgId);
      res.status(200).json(ApiResponseFactory.success({ message: 'Organization deleted successfully' }));
    } catch (err) {
      next(err);
    }
  };

  public getAllOrganizations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string;
      const isActive = req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined;

      const result = await this.orgRepo.find({
        filter: { isActive, search },
        pagination: { page, limit },
      });

      const dtos = result.items.map((o) => this.mapper.toDto(o));

      res.status(200).json(ApiResponseFactory.success(dtos, {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
        hasNext: result.hasNext,
        hasPrev: result.hasPrev,
      }));
    } catch (err) {
      next(err);
    }
  };

  public deleteOrganization = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id) {
        return next(new BadRequestError('Organization ID is required'));
      }
      await this.orgRepo.delete(id);
      res.status(200).json(ApiResponseFactory.success({ message: 'Organization deleted successfully' }));
    } catch (err) {
      next(err);
    }
  };

  public inviteUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, name, role, phone } = req.body;
      const context = RequestContextHolder.get();
      const orgId = context?.organizationId;

      if (!email || !name || !role) {
        return next(new BadRequestError('email, name, and role are required'));
      }
      if (!orgId) {
        return next(new NotFoundError('Organization not found in context.'));
      }

      const userResponse = await this.memberService.inviteUser(
        { orgId, email, name, role, phone },
        this.passwordHasher
      );

      res.status(201).json(ApiResponseFactory.success(userResponse));
    } catch (err) {
      next(err);
    }
  };

  public removeMember = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const memberId = req.params.id;
      const context = RequestContextHolder.get();
      const orgId = context?.organizationId;

      if (!memberId) {
        return next(new BadRequestError('Member ID is required'));
      }
      if (!orgId) {
        return next(new NotFoundError('Organization not found in context.'));
      }

      const org = await this.orgRepo.findById(orgId);
      if (!org) {
        return next(new NotFoundError('Organization not found'));
      }

      await this.memberService.removeMember(orgId, memberId);
      res.status(200).json(ApiResponseFactory.success({ message: 'Member removed successfully' }));
    } catch (err) {
      next(err);
    }
  };

  public getActivityLog = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.status(200).json({ status: 'success', results: 0, data: { logs: [] } });
    } catch (err) { 
      next(err); 
    }
  };
}
