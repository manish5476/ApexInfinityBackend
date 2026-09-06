import { IUseCase, IApplicationContext } from '../../../../core/application/IUseCase';
import { IUserRepository } from '../../domain/ports/IUserRepository';
import { ISessionRepository } from '../../domain/ports/ISessionRepository';
import { ITokenService } from '../../../../infrastructure/security/ITokenService';
import { hashToken } from '../../../../infrastructure/security/hashToken';
import { Result } from '../../../../shared/result';
import { UnauthorizedError } from '../../../../shared/errors';

export interface RefreshTokenInput {
  refreshToken?: string;
}

export interface RefreshTokenResult {
  token: string;
  expiresIn: string;
}

export class RefreshTokenUseCase implements IUseCase<RefreshTokenInput, RefreshTokenResult> {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly sessionRepo: ISessionRepository,
    private readonly tokenService: ITokenService,
    private readonly accessTokenExpiresIn = '15m'
  ) {}

  public async execute(
    input: RefreshTokenInput,
    _context?: IApplicationContext
  ): Promise<Result<RefreshTokenResult>> {
    try {
      if (!input.refreshToken) {
        return Result.fail(new UnauthorizedError('No refresh token provided. Please login again.'));
      }

      let decoded;
      try {
        decoded = this.tokenService.verifyRefreshToken(input.refreshToken);
      } catch (err) {
        return Result.fail(err as Error);
      }

      const session = await this.sessionRepo.findByRefreshTokenHash(hashToken(input.refreshToken));
      if (!session || !session.isValid) {
        return Result.fail(new UnauthorizedError('Session expired. Please login again.'));
      }

      if (session.isExpired()) {
        session.terminate();
        await this.sessionRepo.save(session);
        return Result.fail(new UnauthorizedError('Session expired. Please login again.'));
      }

      const user = await this.userRepo.findById(decoded.userId);
      if (!user || !user.isActive) {
        session.terminate();
        await this.sessionRepo.save(session);
        return Result.fail(new UnauthorizedError('Account is not active. Please contact administrator.'));
      }

      const accessToken = this.tokenService.generateToken({
        userId: user.id,
        organizationId: user.organizationId,
        roles: [...user.roles],
        permissions: [...user.permissions],
      });

      session.rotateAccessToken(hashToken(accessToken));
      await this.sessionRepo.save(session);

      return Result.ok({
        token: accessToken,
        expiresIn: this.accessTokenExpiresIn,
      });
    } catch (err) {
      return Result.fail(err as Error);
    }
  }
}
