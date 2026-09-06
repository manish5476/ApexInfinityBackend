import { LoginUseCase } from '../../../src/modules/auth/application/use-cases/LoginUseCase';
import { IssueAuthSessionService } from '../../../src/modules/auth/application/services/IssueAuthSessionService';
import { InMemoryUserRepository } from '../../../src/modules/auth/infrastructure/repositories/InMemoryUserRepository';
import { InMemorySessionRepository } from '../../../src/modules/auth/infrastructure/repositories/InMemorySessionRepository';
import { UserMapper } from '../../../src/modules/auth/application/mappers/UserMapper';
import { User } from '../../../src/modules/auth/domain/entities/User';
import { IPasswordHasher } from '../../../src/infrastructure/security/IPasswordHasher';
import { ITokenService } from '../../../src/infrastructure/security/ITokenService';
import { UnauthorizedError } from '../../../src/shared/errors';

describe('LoginUseCase (Application Layer Test with In-Memory Stub)', () => {
  let userRepo: InMemoryUserRepository;
  let mapper: UserMapper;
  let mockHasher: IPasswordHasher;
  let mockTokenService: ITokenService;
  let useCase: LoginUseCase;

  beforeEach(async () => {
    userRepo = new InMemoryUserRepository();
    mapper = new UserMapper();

    mockHasher = {
      hash: jest.fn().mockImplementation((pwd) => Promise.resolve(`hashed_${pwd}`)),
      compare: jest.fn().mockImplementation((plain, hashed) => Promise.resolve(`hashed_${plain}` === hashed)),
    };

    mockTokenService = {
      generateToken: jest.fn().mockReturnValue('valid_auth_token_123'),
      verifyToken: jest.fn(),
      generateRefreshToken: jest.fn().mockReturnValue('valid_refresh_token_123'),
      verifyRefreshToken: jest.fn(),
    };

    const existingUser = User.create({
      email: 'active.user@apexinfinity.com',
      passwordHash: 'hashed_correctPassword',
      name: 'Active User',
      organizationId: 'org-abc',
      roles: ['manager'],
    });
    await userRepo.save(existingUser);

    const issueSession = new IssueAuthSessionService(
      new InMemorySessionRepository(),
      mockTokenService,
      '15m'
    );
    useCase = new LoginUseCase(userRepo, mapper, mockHasher, issueSession);
  });

  it('should authenticate valid credentials and return JWT token + user DTO', async () => {
    const result = await useCase.execute({
      email: 'active.user@apexinfinity.com',
      password: 'correctPassword',
    });

    expect(result.isSuccess).toBe(true);
    const authResult = result.getValue();
    expect(authResult.token).toBe('valid_auth_token_123');
    expect(authResult.refreshToken).toBe('valid_refresh_token_123');
    expect(authResult.user.email).toBe('active.user@apexinfinity.com');
    expect(authResult.user.roles).toContain('manager');
  });

  it('should reject invalid password with UnauthorizedError', async () => {
    const result = await useCase.execute({
      email: 'active.user@apexinfinity.com',
      password: 'wrongPassword',
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError()).toBeInstanceOf(UnauthorizedError);
  });

  it('should reject nonexistent email with UnauthorizedError', async () => {
    const result = await useCase.execute({
      email: 'nonexistent@apexinfinity.com',
      password: 'anyPassword',
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError()).toBeInstanceOf(UnauthorizedError);
  });
});
