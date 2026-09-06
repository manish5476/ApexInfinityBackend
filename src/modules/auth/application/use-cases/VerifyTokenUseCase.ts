import { IUseCase, IApplicationContext } from '../../../../core/application/IUseCase';
import { IUserRepository } from '../../domain/ports/IUserRepository';
import { ISessionRepository } from '../../domain/ports/ISessionRepository';
import { ITokenService } from '../../../../infrastructure/security/ITokenService';
import { hashToken } from '../../../../infrastructure/security/hashToken';
import { UserMapper } from '../mappers/UserMapper';
import { UserResponseDto } from '../dto/AuthResultDto';
import { Result } from '../../../../shared/result';
import { UnauthorizedError } from '../../../../shared/errors';

export interface VerifyTokenInput {
  accessToken?: string;
}

export interface VerifyTokenResult {
  user: UserResponseDto;
  session?: {
    id: string;
    browser?: string;
    deviceType?: string;
    lastActivityAt: string;
  };
}

export class VerifyTokenUseCase implements IUseCase<VerifyTokenInput, VerifyTokenResult> {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly sessionRepo: ISessionRepository,
    private readonly tokenService: ITokenService,
    private readonly mapper: UserMapper
  ) {}

  public async execute(
    input: VerifyTokenInput,
    _context?: IApplicationContext
  ): Promise<Result<VerifyTokenResult>> {
    try {
      if (!input.accessToken) {
        return Result.fail(new UnauthorizedError('No token provided'));
      }

      let decoded;
      try {
        decoded = this.tokenService.verifyToken(input.accessToken);
      } catch (err) {
        return Result.fail(err as Error);
      }

      const user = await this.userRepo.findById(decoded.userId);
      if (!user || !user.isActive) {
        return Result.fail(new UnauthorizedError('User account is deactivated'));
      }

      const session = await this.sessionRepo.findByAccessTokenHash(hashToken(input.accessToken));
      if (!session) {
        return Result.fail(new UnauthorizedError('Session expired'));
      }

      session.touch();
      await this.sessionRepo.save(session);

      return Result.ok({
        user: this.mapper.toDto(user),
        session: {
          id: session.id,
          browser: session.browser,
          deviceType: session.deviceType,
          lastActivityAt: session.lastActivityAt.toISOString(),
        },
      });
    } catch (err) {
      return Result.fail(err as Error);
    }
  }
}
