import { IUseCase, IApplicationContext } from '../../../../core/application/IUseCase';
import { LoginDto } from '../dto/AuthResultDto';
import { AuthResultDto } from '../dto/AuthResultDto';
import { IUserRepository } from '../../domain/ports/IUserRepository';
import { UserMapper } from '../mappers/UserMapper';
import { IPasswordHasher } from '../../../../infrastructure/security/IPasswordHasher';
import { IOrganizationRepository } from '../../../organization/domain/ports/IOrganizationRepository';
import { IssueAuthSessionService } from '../services/IssueAuthSessionService';
import { Result } from '../../../../shared/result';
import { UnauthorizedError, NotFoundError } from '../../../../shared/errors';

export class LoginUseCase implements IUseCase<LoginDto, AuthResultDto> {
  private readonly userRepo: IUserRepository;
  private readonly mapper: UserMapper;
  private readonly passwordHasher: IPasswordHasher;
  private readonly issueSession: IssueAuthSessionService;
  private readonly organizationRepo?: IOrganizationRepository;

  constructor(
    userRepo: IUserRepository,
    mapper: UserMapper,
    passwordHasher: IPasswordHasher,
    issueSession: IssueAuthSessionService,
    organizationRepo?: IOrganizationRepository
  ) {
    this.userRepo = userRepo;
    this.mapper = mapper;
    this.passwordHasher = passwordHasher;
    this.issueSession = issueSession;
    this.organizationRepo = organizationRepo;
  }

  public async execute(
    input: LoginDto,
    _context?: IApplicationContext
  ): Promise<Result<AuthResultDto>> {
    try {
      let organizationId: string | undefined = input.organizationId;
      const tenantIdentifier = (
        input.uniqueShopId ||
        input.shopId ||
        input.organizationSlug ||
        input.orgSlug ||
        input.organizationName
      )?.trim();

      if (tenantIdentifier && this.organizationRepo) {
        let org = await this.organizationRepo.findByShopId(tenantIdentifier);
        if (!org) {
          org = await this.organizationRepo.findBySlug(tenantIdentifier);
        }
        if (!org) {
          return Result.fail(new NotFoundError('Organization', tenantIdentifier));
        }
        organizationId = org.id;
      }

      const identifier = input.email.trim();
      let user = await this.userRepo.findByEmailOrPhone(identifier, organizationId);
      if (!user) {
        user = await this.userRepo.findByEmailOrPhone(identifier);
      }

      if (!user) {
        return Result.fail(new UnauthorizedError('Invalid email or password.'));
      }

      if (organizationId && user.organizationId && String(user.organizationId) !== String(organizationId)) {
        return Result.fail(new UnauthorizedError('Invalid email or password.'));
      }

      if (!user.isActive) {
        return Result.fail(
          new UnauthorizedError('Account is deactivated. Please contact your organization administrator.')
        );
      }

      if (user.status === 'pending') {
        return Result.fail(
          new UnauthorizedError('Your account is pending approval by the organization administrator.')
        );
      }
      if (user.status === 'rejected') {
        return Result.fail(
          new UnauthorizedError('Your registration request was rejected.')
        );
      }
      if (user.status === 'suspended') {
        return Result.fail(
          new UnauthorizedError('Your account has been suspended. Please contact your organization administrator.')
        );
      }

      const isValidPassword = await this.passwordHasher.compare(input.password, user.passwordHash);
      if (!isValidPassword) {
        return Result.fail(new UnauthorizedError('Invalid email or password.'));
      }

      const issued = await this.issueSession.issue(user, input.device);

      let organizationData: { id: string; _id?: string; name: string; uniqueShopId: string } | undefined;
      if (this.organizationRepo) {
        const targetOrgId = organizationId || user.organizationId;
        if (targetOrgId) {
          const org = await this.organizationRepo.findById(targetOrgId);
          if (org) {
            organizationData = {
              id: org.id,
              _id: org.id,
              name: org.name,
              uniqueShopId: org.uniqueShopId || '',
            };
          }
        }
      }

      return Result.ok({
        token: issued.accessToken,
        refreshToken: issued.refreshToken,
        expiresIn: this.issueSession.expiresIn,
        sessionId: issued.session.id,
        user: this.mapper.toDto(user),
        session: {
          id: issued.session.id,
          _id: issued.session.id,
          browser: input.device?.browser,
          os: input.device?.os,
          deviceType: input.device?.deviceType,
          ipAddress: input.device?.ipAddress,
          lastActivityAt: issued.session.lastActivityAt,
        },
        organization: organizationData,
      });
    } catch (err) {
      return Result.fail(err as Error);
    }
  }
}
