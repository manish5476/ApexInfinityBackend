import { IUseCase, IApplicationContext } from '../../../../core/application/IUseCase';
import { ISessionRepository } from '../../domain/ports/ISessionRepository';
import { hashToken } from '../../../../infrastructure/security/hashToken';
import { Result } from '../../../../shared/result';

export interface LogoutInput {
  accessToken?: string;
  refreshToken?: string;
  userId?: string;
}

export class LogoutUseCase implements IUseCase<LogoutInput, { message: string }> {
  constructor(private readonly sessionRepo: ISessionRepository) {}

  public async execute(
    input: LogoutInput,
    context?: IApplicationContext
  ): Promise<Result<{ message: string }>> {
    try {
      const userId = input.userId || context?.userId;

      if (input.accessToken) {
        const session = await this.sessionRepo.findByAccessTokenHash(hashToken(input.accessToken));
        if (session) {
          session.terminate();
          await this.sessionRepo.save(session);
        }
      } else if (input.refreshToken) {
        const session = await this.sessionRepo.findByRefreshTokenHash(hashToken(input.refreshToken));
        if (session) {
          session.terminate();
          await this.sessionRepo.save(session);
        }
      } else if (userId) {
        await this.sessionRepo.terminateAllForUser(userId);
      }

      return Result.ok({ message: 'Logged out successfully.' });
    } catch (err) {
      return Result.fail(err as Error);
    }
  }
}
