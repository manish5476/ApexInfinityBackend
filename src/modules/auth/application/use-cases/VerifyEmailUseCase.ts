import { IUseCase, IApplicationContext } from '../../../../core/application/IUseCase';
import { IUserRepository } from '../../domain/ports/IUserRepository';
import { hashToken } from '../../../../infrastructure/security/hashToken';
import { Result } from '../../../../shared/result';
import { ValidationError } from '../../../../shared/errors';

export interface VerifyEmailInput {
  token: string;
}

export class VerifyEmailUseCase implements IUseCase<VerifyEmailInput, { message: string }> {
  constructor(private readonly userRepo: IUserRepository) {}

  public async execute(
    input: VerifyEmailInput,
    _context?: IApplicationContext
  ): Promise<Result<{ message: string }>> {
    try {
      const user = await this.userRepo.findByEmailVerificationTokenHash(hashToken(input.token));
      if (!user) {
        return Result.fail(new ValidationError('Invalid or expired verification token'));
      }

      try {
        user.confirmEmailVerification();
      } catch (err) {
        return Result.fail(new ValidationError((err as Error).message));
      }

      await this.userRepo.save(user);
      return Result.ok({ message: 'Email verified successfully.' });
    } catch (err) {
      return Result.fail(err as Error);
    }
  }
}
