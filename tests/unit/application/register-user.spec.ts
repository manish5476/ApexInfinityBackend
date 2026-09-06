import { RegisterUserUseCase } from '../../../src/modules/auth/application/use-cases/RegisterUserUseCase';
import { IssueAuthSessionService } from '../../../src/modules/auth/application/services/IssueAuthSessionService';
import { InMemoryUserRepository } from '../../../src/modules/auth/infrastructure/repositories/InMemoryUserRepository';
import { InMemorySessionRepository } from '../../../src/modules/auth/infrastructure/repositories/InMemorySessionRepository';
import { UserMapper } from '../../../src/modules/auth/application/mappers/UserMapper';
import { InMemoryEventBus } from '../../../src/infrastructure/messaging/InMemoryEventBus';
import { IPasswordHasher } from '../../../src/infrastructure/security/IPasswordHasher';
import { ITokenService } from '../../../src/infrastructure/security/ITokenService';
import { ConflictError } from '../../../src/shared/errors';

describe('RegisterUserUseCase (Application Layer Test with In-Memory Stub)', () => {
  let userRepo: InMemoryUserRepository;
  let mapper: UserMapper;
  let eventBus: InMemoryEventBus;
  let mockHasher: IPasswordHasher;
  let mockTokenService: ITokenService;
  let useCase: RegisterUserUseCase;

  beforeEach(() => {
    userRepo = new InMemoryUserRepository();
    mapper = new UserMapper();
    eventBus = new InMemoryEventBus();

    mockHasher = {
      hash: jest.fn().mockImplementation((pwd) => Promise.resolve(`hashed_${pwd}`)),
      compare: jest.fn().mockResolvedValue(true),
    };

    mockTokenService = {
      generateToken: jest.fn().mockReturnValue('mock_jwt_token_xyz'),
      verifyToken: jest.fn(),
      generateRefreshToken: jest.fn().mockReturnValue('mock_refresh_token_xyz'),
      verifyRefreshToken: jest.fn(),
    };

    const issueSession = new IssueAuthSessionService(
      new InMemorySessionRepository(),
      mockTokenService,
      '15m'
    );

    useCase = new RegisterUserUseCase(
      userRepo,
      mapper,
      mockHasher,
      issueSession,
      eventBus
    );
  });

  it('should register a new user, dispatch domain event, and return token + dto', async () => {
    const publishedEvents: string[] = [];
    eventBus.subscribe('user.registered', (payload) => {
      publishedEvents.push((payload as { email: string }).email);
    });

    const result = await useCase.execute({
      email: 'newuser@apexinfinity.com',
      password: 'superSecretPassword123',
      name: 'New User',
      organizationId: 'org-123',
    });

    expect(result.isSuccess).toBe(true);
    const authResult = result.getValue();

    expect(authResult.token).toBe('mock_jwt_token_xyz');
    expect(authResult.refreshToken).toBe('mock_refresh_token_xyz');
    expect(authResult.user.email).toBe('newuser@apexinfinity.com');
    expect(authResult.user.name).toBe('New User');
    expect(authResult.user.organizationId).toBe('org-123');

    const persisted = await userRepo.findByEmail('newuser@apexinfinity.com');
    expect(persisted).not.toBeNull();
    expect(persisted?.passwordHash).toBe('hashed_superSecretPassword123');

    expect(publishedEvents).toContain('newuser@apexinfinity.com');
  });

  it('should reject registration if email already exists with ConflictError', async () => {
    await useCase.execute({
      email: 'duplicate@apexinfinity.com',
      password: 'password123',
      name: 'First User',
    });

    const duplicateResult = await useCase.execute({
      email: 'duplicate@apexinfinity.com',
      password: 'password456',
      name: 'Second User',
    });

    expect(duplicateResult.isFailure).toBe(true);
    expect(duplicateResult.getError()).toBeInstanceOf(ConflictError);
  });
});
