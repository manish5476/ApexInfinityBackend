import { IUseCase, IApplicationContext } from '../../../../core/application/IUseCase';
import { ISessionRepository } from '../../domain/ports/ISessionRepository';
import { Result } from '../../../../shared/result';
import { UnauthorizedError } from '../../../../shared/errors';

export class LogoutAllUseCase implements IUseCase<void, { message: string }> {
  constructor(private readonly sessionRepo: ISessionRepository) {}

  public async execute(
    _input: void,
    context?: IApplicationContext
  ): Promise<Result<{ message: string }>> {
    try {
      if (!context?.userId) {
        return Result.fail(new UnauthorizedError('User not authenticated'));
      }

      await this.sessionRepo.terminateAllForUser(context.userId);
      return Result.ok({ message: 'Logged out from all devices successfully.' });
    } catch (err) {
      return Result.fail(err as Error);
    }
  }
}
