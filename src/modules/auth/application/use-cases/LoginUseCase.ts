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
      let organizationId: string | undefined;
      if (input.uniqueShopId && this.organizationRepo) {
        const org = await this.organizationRepo.findBySlug(input.uniqueShopId.trim().toLowerCase());
        if (!org) {
          return Result.fail(new NotFoundError('Organization', input.uniqueShopId));
        }
        organizationId = org.id;
      }

      const normalizedEmail = input.email.trim().toLowerCase();
      const user = await this.userRepo.findByEmail(normalizedEmail);

      if (!user) {
        return Result.fail(new UnauthorizedError('Invalid email or password.'));
      }

      if (organizationId && user.organizationId && user.organizationId !== organizationId) {
        return Result.fail(new UnauthorizedError('Invalid email or password.'));
      }

      if (!user.isActive) {
        return Result.fail(
          new UnauthorizedError('Account is deactivated. Please contact your organization administrator.')
        );
      }

      const isValidPassword = await this.passwordHasher.compare(input.password, user.passwordHash);
      if (!isValidPassword) {
        return Result.fail(new UnauthorizedError('Invalid email or password.'));
      }

      const issued = await this.issueSession.issue(user, input.device);

      return Result.ok({
        token: issued.accessToken,
        refreshToken: issued.refreshToken,
        expiresIn: this.issueSession.expiresIn,
        sessionId: issued.session.id,
        user: this.mapper.toDto(user),
      });
    } catch (err) {
      return Result.fail(err as Error);
    }
  }
}
