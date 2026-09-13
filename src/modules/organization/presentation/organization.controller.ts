import { Request, Response, NextFunction } from 'express';
import { Connection } from 'mongoose';
import crypto from 'crypto';
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
import { getUserModel } from '../../auth/infrastructure/persistence/user.model';
import { getRoleModel } from '../../auth/infrastructure/persistence/role.model';
import { getEmployeeModel } from '../../hrms/infrastructure/persistence/employee.model';
import { AuthenticatedUser } from '../../../middleware/auth.middleware';

export class OrganizationController {
  private readonly mapper = new OrganizationMapper();

  constructor(
    private readonly createUseCase: CreateOrganizationUseCase,
    private readonly getByIdUseCase: GetOrganizationByIdUseCase,
    private readonly updateUseCase: UpdateOrganizationUseCase,
    private readonly getMyOrgUseCase: GetMyOrganizationUseCase,
    private readonly orgRepo: IOrganizationRepository,
    private readonly connection: Connection,
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

      const UserModel = getUserModel(this.connection);
      const members = await UserModel.find({ organizationId: orgId, status: { $ne: 'rejected' } })
        .populate('roles')
        .lean();

      res.status(200).json(ApiResponseFactory.success({
        ...this.mapper.toDto(result.getValue()),
        members
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

      const UserModel = getUserModel(this.connection);
      const users = await UserModel.find({ email }).lean();
      
      const organizations: any[] = [];
      const orgIds = [...new Set(users.map(u => u.organizationId).filter(id => id))];

      for (const orgId of orgIds) {
        const org = await this.orgRepo.findById(orgId as string);
        if (org) {
          organizations.push({ name: org.name, uniqueShopId: org.uniqueShopId });
        }
      }

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

      const UserModel = getUserModel(this.connection);
      const pendingUsers = await UserModel.find({ organizationId: orgId, status: 'pending' })
        .select('name email phone createdAt status')
        .sort({ createdAt: -1 })
        .lean();

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

      const UserModel = getUserModel(this.connection);
      const user = await UserModel.findOne({ _id: userId, organizationId: orgId, status: 'pending' });
      if (!user) {
        return next(new NotFoundError('Pending user not found in this organization'));
      }

      const RoleModel = getRoleModel(this.connection);
      const role = await RoleModel.findOne({ _id: roleId, organizationId: orgId });
      if (!role) {
        return next(new BadRequestError('Invalid role for this organization'));
      }

      user.status = 'approved';
      user.roles = [roleId];
      if (branchId) {
        (user as any).branchId = branchId;
      }
      
      await user.save();

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

      const UserModel = getUserModel(this.connection);
      const result = await UserModel.deleteOne({ _id: userId, organizationId: orgId, status: 'pending' });

      if (result.deletedCount === 0) {
        return next(new NotFoundError('Pending user not found in this organization'));
      }

      res.status(200).json(ApiResponseFactory.success(null, 'Member request rejected successfully'));
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

      res.status(200).json(ApiResponseFactory.success(null, 'Organization deleted successfully'));
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

      const dtos = result.data.map((o) => this.mapper.toDto(o));

      res.status(200).json(ApiResponseFactory.success({
        data: dtos,
        total: result.total,
        page: result.page,
        limit: result.limit
      }));
    } catch (err) {
      next(err);
    }
  };

  public deleteOrganization = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      await this.orgRepo.delete(id);
      res.status(200).json(ApiResponseFactory.success(null, 'Organization deleted successfully'));
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

      const UserModel = getUserModel(this.connection);
      const existingUser = await UserModel.findOne({ email });
      if (existingUser) {
        return next(new BadRequestError('User with this email already exists'));
      }

      const tempPassword = crypto.randomBytes(16).toString('hex');
      const hashedPassword = await this.passwordHasher.hash(tempPassword);

      const userId = crypto.randomUUID();
      const newUser = new UserModel({
        _id: userId,
        email,
        name,
        phone,
        passwordHash: hashedPassword,
        roles: [role],
        organizationId: orgId,
        isActive: true
      });

      await newUser.save();

      const userResponse = newUser.toObject();
      delete (userResponse as Record<string, unknown>).passwordHash;

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

      if (!orgId) {
        return next(new NotFoundError('Organization not found in context.'));
      }

      const org = await this.orgRepo.findById(orgId);
      if (!org) {
        return next(new NotFoundError('Organization not found'));
      }

      const UserModel = getUserModel(this.connection);
      const user = await UserModel.findOne({ _id: memberId, organizationId: orgId });
      if (!user) {
        return next(new NotFoundError('Member not found in this organization'));
      }

      if (user.roles?.includes('owner' as any)) {
        return next(new ForbiddenError('Cannot remove the owner of the organization'));
      }

      user.status = 'inactive';
      user.isActive = false;
      await user.save();

      const EmployeeModel = getEmployeeModel(this.connection);
      await EmployeeModel.updateOne({ userId: memberId, organizationId: orgId }, { status: 'inactive' });

      res.status(200).json(ApiResponseFactory.success(null, 'Member removed successfully'));
    } catch (err) {
      next(err);
    }
  };

  public getActivityLog = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.status(200).json({ status: 'success', results: 0, data: { logs: [] } });
    } catch (err) { 
      next(err); 
    }
  };
}
