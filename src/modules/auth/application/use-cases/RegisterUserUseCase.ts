import { IUseCase, IApplicationContext } from '../../../../core/application/IUseCase';
import { RegisterUserDto } from '../dto/RegisterUserDto';
import { AuthResultDto } from '../dto/AuthResultDto';
import { IUserRepository } from '../../domain/ports/IUserRepository';
import { UserMapper } from '../mappers/UserMapper';
import { IPasswordHasher } from '../../../../infrastructure/security/IPasswordHasher';
import { IEventBus } from '../../../../infrastructure/messaging/IEventBus';
import { IOrganizationRepository } from '../../../organization/domain/ports/IOrganizationRepository';
import { User } from '../../domain/entities/User';
import { IssueAuthSessionService } from '../services/IssueAuthSessionService';
import { Result } from '../../../../shared/result';
import { ConflictError, NotFoundError } from '../../../../shared/errors';

export class RegisterUserUseCase implements IUseCase<RegisterUserDto, AuthResultDto> {
  private readonly userRepo: IUserRepository;
  private readonly mapper: UserMapper;
  private readonly passwordHasher: IPasswordHasher;
  private readonly issueSession: IssueAuthSessionService;
  private readonly eventBus?: IEventBus;
  private readonly organizationRepo?: IOrganizationRepository;

  constructor(
    userRepo: IUserRepository,
    mapper: UserMapper,
    passwordHasher: IPasswordHasher,
    issueSession: IssueAuthSessionService,
    eventBus?: IEventBus,
    organizationRepo?: IOrganizationRepository
  ) {
    this.userRepo = userRepo;
    this.mapper = mapper;
    this.passwordHasher = passwordHasher;
    this.issueSession = issueSession;
    this.eventBus = eventBus;
    this.organizationRepo = organizationRepo;
  }

  public async execute(
    input: RegisterUserDto,
    _context?: IApplicationContext
  ): Promise<Result<AuthResultDto>> {
    try {
      const normalizedEmail = input.email.trim().toLowerCase();
      const existing = await this.userRepo.findByEmail(normalizedEmail);
      if (existing) {
        return Result.fail(
          new ConflictError(`A user with email '${normalizedEmail}' already exists.`)
        );
      }

      let organizationId = input.organizationId;
      if (!organizationId && input.uniqueShopId && this.organizationRepo) {
        const org = await this.organizationRepo.findBySlug(input.uniqueShopId.trim().toLowerCase());
        if (!org) {
          return Result.fail(new NotFoundError('Organization', input.uniqueShopId));
        }
        organizationId = org.id;
      }

      const passwordHash = await this.passwordHasher.hash(input.password);

      const user = User.create({
        email: normalizedEmail,
        passwordHash,
        name: input.name,
        organizationId,
        roles: input.roles || ['user'],
        phone: input.phone,
      });

      const saved = await this.userRepo.save(user);

      if (this.eventBus) {
        for (const event of user.domainEvents) {
          await this.eventBus.publishDomainEvent(event);
        }
        user.clearDomainEvents();
      }

      const issued = await this.issueSession.issue(saved);

      return Result.ok({
        token: issued.accessToken,
        refreshToken: issued.refreshToken,
        expiresIn: this.issueSession.expiresIn,
        sessionId: issued.session.id,
        user: this.mapper.toDto(saved),
      });
    } catch (err) {
      return Result.fail(err as Error);
    }
  }
}
