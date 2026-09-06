import { IUseCase, IApplicationContext } from '../../../../core/application/IUseCase';
import { IUserRepository } from '../../domain/ports/IUserRepository';
import { ISessionRepository } from '../../domain/ports/ISessionRepository';
import { IPasswordHasher } from '../../../../infrastructure/security/IPasswordHasher';
import { hashToken } from '../../../../infrastructure/security/hashToken';
import { UserMapper } from '../mappers/UserMapper';
import { IssueAuthSessionService } from '../services/IssueAuthSessionService';
import { AuthResultDto, DeviceMeta } from '../dto/AuthResultDto';
import { Result } from '../../../../shared/result';
import { ValidationError } from '../../../../shared/errors';

export interface ResetPasswordInput {
  token: string;
  password: string;
  device?: DeviceMeta;
}

export class ResetPasswordUseCase implements IUseCase<ResetPasswordInput, AuthResultDto> {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly sessionRepo: ISessionRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly mapper: UserMapper,
    private readonly issueSession: IssueAuthSessionService
  ) {}

  public async execute(
    input: ResetPasswordInput,
    _context?: IApplicationContext
  ): Promise<Result<AuthResultDto>> {
    try {
      const user = await this.userRepo.findByPasswordResetTokenHash(hashToken(input.token));
      if (!user) {
        return Result.fail(new ValidationError('Password reset token is invalid or has expired.'));
      }

      try {
        user.applyPasswordReset(await this.passwordHasher.hash(input.password));
      } catch (err) {
        return Result.fail(err as Error);
      }

      await this.userRepo.save(user);
      await this.sessionRepo.terminateAllForUser(user.id);

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
