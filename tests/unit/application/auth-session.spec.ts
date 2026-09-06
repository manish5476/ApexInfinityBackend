import { RefreshTokenUseCase } from '../../../src/modules/auth/application/use-cases/RefreshTokenUseCase';
import { LogoutUseCase } from '../../../src/modules/auth/application/use-cases/LogoutUseCase';
import { ForgotPasswordUseCase } from '../../../src/modules/auth/application/use-cases/ForgotPasswordUseCase';
import { ResetPasswordUseCase } from '../../../src/modules/auth/application/use-cases/ResetPasswordUseCase';
import { IssueAuthSessionService } from '../../../src/modules/auth/application/services/IssueAuthSessionService';
import { InMemoryUserRepository } from '../../../src/modules/auth/infrastructure/repositories/InMemoryUserRepository';
import { InMemorySessionRepository } from '../../../src/modules/auth/infrastructure/repositories/InMemorySessionRepository';
import { UserMapper } from '../../../src/modules/auth/application/mappers/UserMapper';
import { User } from '../../../src/modules/auth/domain/entities/User';
import { IPasswordHasher } from '../../../src/infrastructure/security/IPasswordHasher';
import { ITokenService } from '../../../src/infrastructure/security/ITokenService';
import { IEmailSender } from '../../../src/infrastructure/email/IEmailSender';
import { hashToken } from '../../../src/infrastructure/security/hashToken';
import { UnauthorizedError, ValidationError } from '../../../src/shared/errors';

describe('Auth session and password recovery use cases', () => {
  let userRepo: InMemoryUserRepository;
  let sessionRepo: InMemorySessionRepository;
  let mapper: UserMapper;
  let hasher: IPasswordHasher;
  let tokenService: ITokenService;
  let issueSession: IssueAuthSessionService;
  let user: User;

  beforeEach(async () => {
    userRepo = new InMemoryUserRepository();
    sessionRepo = new InMemorySessionRepository();
    mapper = new UserMapper();
    hasher = {
      hash: jest.fn().mockImplementation((pwd) => Promise.resolve(`hashed_${pwd}`)),
      compare: jest.fn().mockImplementation((plain, hashed) => Promise.resolve(`hashed_${plain}` === hashed)),
    };
    tokenService = {
      generateToken: jest.fn().mockReturnValue('new_access_token'),
      verifyToken: jest.fn(),
      generateRefreshToken: jest.fn().mockReturnValue('refresh_token_raw'),
      verifyRefreshToken: jest.fn().mockReturnValue({ userId: 'will-set' }),
    };
    issueSession = new IssueAuthSessionService(sessionRepo, tokenService, '15m');

    user = User.create({
      email: 'reset.user@apexinfinity.com',
      passwordHash: 'hashed_oldPassword',
      name: 'Reset User',
    });
    await userRepo.save(user);
    (tokenService.verifyRefreshToken as jest.Mock).mockReturnValue({ userId: user.id });
  });

  it('should rotate access token for a valid refresh session', async () => {
    const issued = await issueSession.issue(user);
    const useCase = new RefreshTokenUseCase(userRepo, sessionRepo, tokenService, '15m');

    const result = await useCase.execute({ refreshToken: issued.refreshToken });

    expect(result.isSuccess).toBe(true);
    expect(result.getValue().token).toBe('new_access_token');
    const sessions = await sessionRepo.findValidByUserId(user.id);
    expect(sessions[0]?.accessTokenHash).toBe(hashToken('new_access_token'));
  });

  it('should reject refresh when no session exists for the token', async () => {
    const useCase = new RefreshTokenUseCase(userRepo, sessionRepo, tokenService, '15m');
    const result = await useCase.execute({ refreshToken: 'unknown-refresh' });
    expect(result.isFailure).toBe(true);
    expect(result.getError()).toBeInstanceOf(UnauthorizedError);
  });

  it('should terminate the matching session on logout', async () => {
    const issued = await issueSession.issue(user);
    const useCase = new LogoutUseCase(sessionRepo);
    const result = await useCase.execute({ accessToken: issued.accessToken });

    expect(result.isSuccess).toBe(true);
    const remaining = await sessionRepo.findValidByUserId(user.id);
    expect(remaining).toHaveLength(0);
  });

  it('should send a reset token for an existing user', async () => {
    const emails: string[] = [];
    const emailSender: IEmailSender = {
      send: jest.fn().mockImplementation(async (msg) => {
        emails.push(msg.to);
      }),
    };
    const useCase = new ForgotPasswordUseCase(userRepo, emailSender, 'http://localhost:4200');
    const result = await useCase.execute({ email: 'reset.user@apexinfinity.com' });

    expect(result.isSuccess).toBe(true);
    expect(emails).toEqual(['reset.user@apexinfinity.com']);
    const persisted = await userRepo.findByEmail('reset.user@apexinfinity.com');
    expect(persisted?.passwordResetTokenHash).toBeDefined();
  });

  it('should reset password with a valid token and issue a new session', async () => {
    user.requestPasswordReset(hashToken('plain-reset-token'), new Date(Date.now() + 60_000));
    await userRepo.save(user);

    const useCase = new ResetPasswordUseCase(userRepo, sessionRepo, hasher, mapper, issueSession);
    const result = await useCase.execute({ token: 'plain-reset-token', password: 'brandNewPassword' });

    expect(result.isSuccess).toBe(true);
    expect(result.getValue().token).toBe('new_access_token');
    const persisted = await userRepo.findByEmail('reset.user@apexinfinity.com');
    expect(persisted?.passwordHash).toBe('hashed_brandNewPassword');
    expect(persisted?.passwordResetTokenHash).toBeUndefined();
  });

  it('should reject an invalid password reset token', async () => {
    const useCase = new ResetPasswordUseCase(userRepo, sessionRepo, hasher, mapper, issueSession);
    const result = await useCase.execute({ token: 'missing', password: 'brandNewPassword' });
    expect(result.isFailure).toBe(true);
    expect(result.getError()).toBeInstanceOf(ValidationError);
  });
});
