import { IUseCase, IApplicationContext } from '../../../../core/application/IUseCase';
import { IUserRepository } from '../../domain/ports/IUserRepository';
import { ISessionRepository } from '../../domain/ports/ISessionRepository';
import { IPasswordHasher } from '../../../../infrastructure/security/IPasswordHasher';
import { ITokenService } from '../../../../infrastructure/security/ITokenService';
import { hashToken } from '../../../../infrastructure/security/hashToken';
import { Result } from '../../../../shared/result';
import { UnauthorizedError, NotFoundError, ValidationError } from '../../../../shared/errors';

export interface UpdateMyPasswordInput {
  currentPassword: string;
  newPassword: string;
  accessToken?: string;
}

export interface UpdateMyPasswordResult {
  token: string;
  message: string;
}

export class UpdateMyPasswordUseCase
  implements IUseCase<UpdateMyPasswordInput, UpdateMyPasswordResult>
{
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly sessionRepo: ISessionRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly tokenService: ITokenService
  ) {}

  public async execute(
    input: UpdateMyPasswordInput,
    context?: IApplicationContext
  ): Promise<Result<UpdateMyPasswordResult>> {
    try {
      if (!context?.userId) {
        return Result.fail(new UnauthorizedError('User not authenticated'));
      }

      if (input.newPassword === input.currentPassword) {
        return Result.fail(
          new ValidationError('New password must be different from current password')
        );
      }

      const user = await this.userRepo.findById(context.userId);
      if (!user) {
        return Result.fail(new NotFoundError('User', context.userId));
      }

      const matches = await this.passwordHasher.compare(input.currentPassword, user.passwordHash);
      if (!matches) {
        return Result.fail(new UnauthorizedError('Current password is incorrect.'));
      }

      user.changePassword(await this.passwordHasher.hash(input.newPassword));
      await this.userRepo.save(user);

      let currentSessionId: string | undefined;
      if (input.accessToken) {
        const current = await this.sessionRepo.findByAccessTokenHash(hashToken(input.accessToken));
        currentSessionId = current?.id;
      }

      await this.sessionRepo.terminateAllForUser(user.id, currentSessionId);

      const newAccessToken = this.tokenService.generateToken({
        userId: user.id,
        organizationId: user.organizationId,
        roles: [...user.roles],
        permissions: [...user.permissions],
      });

      if (currentSessionId) {
        const current = await this.sessionRepo.findById(currentSessionId);
        if (current && current.isValid) {
          current.rotateAccessToken(hashToken(newAccessToken));
          await this.sessionRepo.save(current);
        }
      }

      return Result.ok({
        token: newAccessToken,
        message: 'Password updated successfully.',
      });
    } catch (err) {
      return Result.fail(err as Error);
    }
  }
}
