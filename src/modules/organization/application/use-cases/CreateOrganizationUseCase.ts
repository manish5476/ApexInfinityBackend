import { IUseCase, IApplicationContext } from '../../../../core/application/IUseCase';
import { Connection } from 'mongoose';
import crypto from 'crypto';
import { IOrganizationRepository } from '../../domain/ports/IOrganizationRepository';
import { OrganizationMapper } from '../mappers/OrganizationMapper';
import { IEventBus } from '../../../../infrastructure/messaging/IEventBus';
import { IPasswordHasher } from '../../../../infrastructure/security/IPasswordHasher';
import { ITokenService } from '../../../../infrastructure/security/ITokenService';
import { Organization } from '../../domain/entities/Organization';
import { Result } from '../../../../shared/result';
import { ConflictError, BadRequestError } from '../../../../shared/errors';
import { OrganizationResponseDto } from '../dto/OrganizationResponseDto';

// Import model getters
import { getOrganizationModel } from '../../infrastructure/persistence/organization.model';
import { getBranchModel } from '../../infrastructure/persistence/branch.model';
import { getRoleModel } from '../../../auth/infrastructure/persistence/role.model';
import { getUserModel } from '../../../auth/infrastructure/persistence/user.model';
import { getShiftModel } from '../../../hrms/infrastructure/persistence/shift.model';
import { getDepartmentModel } from '../../../hrms/infrastructure/persistence/department.model';
import { getDesignationModel } from '../../../hrms/infrastructure/persistence/designation.model';
import { getEmployeeModel } from '../../../hrms/infrastructure/persistence/employee.model';
import { getLeaveBalanceModel } from '../../../hrms/infrastructure/persistence/leave-balance.model';

export interface CreateOrganizationDto {
  organizationName: string;
  slug?: string;
  uniqueShopId?: string;
  primaryEmail?: string;
  primaryPhone?: string;
  gstNumber?: string;
  mainBranchName?: string;
  mainBranchAddress?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  ownerName: string;
  ownerEmail: string;
  ownerPassword: string;
}

export interface CreateOrganizationResult {
  organization: OrganizationResponseDto;
  owner: { id: string; name: string; email: string };
  accessToken: string;
  refreshToken: string;
  setup: {
    branch: string;
    role: string;
    shift: string;
    department: string;
    designation: string;
  };
}

export class CreateOrganizationUseCase
  implements IUseCase<CreateOrganizationDto, CreateOrganizationResult>
{
  private readonly connection: Connection;
  private readonly organizationRepo: IOrganizationRepository;
  private readonly mapper: OrganizationMapper;
  private readonly passwordHasher: IPasswordHasher;
  private readonly tokenService: ITokenService;
  private readonly eventBus?: IEventBus;

  constructor(
    connection: Connection,
    organizationRepo: IOrganizationRepository,
    mapper: OrganizationMapper,
    passwordHasher: IPasswordHasher,
    tokenService: ITokenService,
    eventBus?: IEventBus
  ) {
    this.connection = connection;
    this.organizationRepo = organizationRepo;
    this.mapper = mapper;
    this.passwordHasher = passwordHasher;
    this.tokenService = tokenService;
    this.eventBus = eventBus;
  }

  public async execute(
    input: CreateOrganizationDto,
    _context?: IApplicationContext
  ): Promise<Result<CreateOrganizationResult>> {
    try {
      // 1. Validate required fields
      if (!input.organizationName) return Result.fail(new BadRequestError("Organization name is required"));
      if (!input.ownerName) return Result.fail(new BadRequestError("Owner name is required"));
      if (!input.ownerEmail) return Result.fail(new BadRequestError("Owner email is required"));
      if (!input.ownerPassword) return Result.fail(new BadRequestError("Owner password is required"));

      // 2. Generate slug from organizationName if not provided
      let slug = input.slug;
      if (!slug) {
        slug = input.organizationName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      }

      // 3. Check slug uniqueness
      const existing = await this.organizationRepo.findBySlug(slug);
      if (existing) {
        return Result.fail(
          new ConflictError(`An organization with slug '${slug}' already exists.`)
        );
      }

      // 4. Pre-generate all UUIDs
      const orgId = crypto.randomUUID();
      const branchId = crypto.randomUUID();
      const roleId = crypto.randomUUID();
      const ownerId = crypto.randomUUID();
      const shiftId = crypto.randomUUID();
      const deptId = crypto.randomUUID();
      const desigId = crypto.randomUUID();
      const employeeId = crypto.randomUUID();
      const leaveBalanceId = crypto.randomUUID();

      // 5. Generate uniqueShopId if not provided
      const uniqueShopId = input.uniqueShopId || `ORG-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

      // 6. Hash owner password
      const passwordHash = await this.passwordHasher.hash(input.ownerPassword);

      // 9. getFinancialYear
      const date = new Date();
      const month = date.getMonth(); // 0-11, where 0 is Jan, 3 is April
      const year = date.getFullYear();
      const financialYear = month >= 3 ? `${year}-${year + 1}` : `${year - 1}-${year}`;

      // Split owner name
      const nameParts = input.ownerName.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const OrganizationModel = getOrganizationModel(this.connection);
      const BranchModel = getBranchModel(this.connection);
      const RoleModel = getRoleModel(this.connection);
      const UserModel = getUserModel(this.connection);
      const ShiftModel = getShiftModel(this.connection);
      const DepartmentModel = getDepartmentModel(this.connection);
      const DesignationModel = getDesignationModel(this.connection);
      const EmployeeModel = getEmployeeModel(this.connection);
      const LeaveBalanceModel = getLeaveBalanceModel(this.connection);

      // 7. Start Mongoose session + transaction
      const session = await this.connection.startSession();
      session.startTransaction();

      let savedOrganization;

      try {
        // 8 & 10. Save all sequentially inside transaction
        
        // 1. Organization
        const orgDoc = new OrganizationModel({
          _id: orgId,
          name: input.organizationName,
          slug,
          uniqueShopId,
          primaryEmail: input.primaryEmail,
          primaryPhone: input.primaryPhone,
          gstNumber: input.gstNumber,
          owner: ownerId,
          mainBranch: branchId,
          branches: [branchId],
          whatsappWallet: { credits: 50 },
          features: { whatsappEnabled: true },
          superAdminRole: 'superadmin',
          isActive: true
        });
        await orgDoc.save({ session });
        savedOrganization = orgDoc;

        // 2. Branch
        const branchDoc = new BranchModel({
          _id: branchId,
          organizationId: orgId,
          name: input.mainBranchName || 'Main Branch',
          branchCode: 'MAIN',
          isMainBranch: true,
          address: input.mainBranchAddress || {}
        });
        await branchDoc.save({ session });

        // 3. Role
        const roleDoc = new RoleModel({
          _id: roleId,
          organizationId: orgId,
          name: 'Super Admin',
          permissions: ['*'],
          isSuperAdmin: true,
          isDefault: true
        });
        await roleDoc.save({ session });

        // 4. Shift
        const shiftDoc = new ShiftModel({
          _id: shiftId,
          organizationId: orgId,
          name: 'General Shift',
          code: 'GEN-SHIFT',
          startTime: '09:00',
          endTime: '18:00',
          gracePeriodMins: 15,
          halfDayThresholdHours: 4,
          minFullDayHours: 8,
          unpaidBreakMins: 60,
          weeklyOffs: [0]
        });
        await shiftDoc.save({ session });

        // 5. Department
        const deptDoc = new DepartmentModel({
          _id: deptId,
          organizationId: orgId,
          name: 'Administration',
          code: 'ADMIN',
          managerId: ownerId
        });
        await deptDoc.save({ session });

        // 6. Designation
        const desigDoc = new DesignationModel({
          _id: desigId,
          organizationId: orgId,
          title: 'Director',
          code: 'DIR',
          level: 10
        });
        await desigDoc.save({ session });

        // 7. User/Owner
        const userDoc = new UserModel({
          _id: ownerId,
          email: input.ownerEmail,
          passwordHash,
          name: input.ownerName,
          organizationId: orgId,
          roles: ['owner', 'superadmin'],
          permissions: ['*'],
          isActive: true,
          isOwner: true,
          isSuperAdmin: true,
          status: 'approved',
          phone: input.primaryPhone,
          emailVerified: false
        });
        await userDoc.save({ session });

        // 8. Employee
        const empDoc = new EmployeeModel({
          _id: employeeId,
          organizationId: orgId,
          employeeCode: 'EMP-001',
          userId: ownerId,
          firstName: firstName,
          lastName: lastName,
          email: input.ownerEmail,
          joiningDate: new Date(),
          workMode: 'on_site',
          employmentType: 'full_time',
          status: 'active',
          departmentId: deptId,
          designationId: desigId,
          shiftId: shiftId,
          allowWebPunch: true
        });
        await empDoc.save({ session });

        // 9. LeaveBalance
        const leaveBalanceDoc = new LeaveBalanceModel({
          _id: leaveBalanceId,
          organizationId: orgId,
          userId: ownerId,
          financialYear,
          casualLeave: { total: 12, used: 0 },
          sickLeave: { total: 10, used: 0 },
          earnedLeave: { total: 15, used: 0 }
        });
        await leaveBalanceDoc.save({ session });

        // 11. Commit transaction
        await session.commitTransaction();
      } catch (err: any) {
        await session.abortTransaction();
        if (err.code === 11000) {
           return Result.fail(new ConflictError(`Duplicate key error: ${JSON.stringify(err.keyValue)}`));
        }
        throw err;
      } finally {
        session.endSession();
      }

      // 12. Generate tokens via tokenService
      const accessToken = this.tokenService.signAccessToken({ 
        userId: ownerId, 
        email: input.ownerEmail, 
        organizationId: orgId, 
        roles: ['owner', 'superadmin'] 
      });
      const refreshToken = this.tokenService.signRefreshToken({ 
        userId: ownerId, 
        email: input.ownerEmail, 
        organizationId: orgId, 
        roles: ['owner', 'superadmin'] 
      });

      // 13. Map to DTO
      const rawOrg = savedOrganization.toObject();
      // Adjust mapped values to ensure they match OrganizationPersistenceData
      rawOrg._id = orgId;
      if (!rawOrg.createdAt) rawOrg.createdAt = new Date();
      if (!rawOrg.updatedAt) rawOrg.updatedAt = new Date();
      
      const domainEntity = this.mapper.toDomain(rawOrg as any);
      const organizationResponse = this.mapper.toDto(domainEntity);

      // Return Result.ok with the full result
      return Result.ok({
        organization: organizationResponse,
        owner: { id: ownerId, name: input.ownerName, email: input.ownerEmail },
        accessToken,
        refreshToken,
        setup: {
          branch: branchId,
          role: roleId,
          shift: shiftId,
          department: deptId,
          designation: desigId,
        }
      });
    } catch (err) {
      return Result.fail(err as Error);
    }
  }
}
