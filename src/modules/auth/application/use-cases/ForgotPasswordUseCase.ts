import { IUseCase, IApplicationContext } from '../../../../core/application/IUseCase';
import { IUserRepository } from '../../domain/ports/IUserRepository';
import { IEmailSender } from '../../../../infrastructure/email/IEmailSender';
import { generateOpaqueToken, hashToken } from '../../../../infrastructure/security/hashToken';
import { Result } from '../../../../shared/result';
import { ValidationError } from '../../../../shared/errors';

export interface ForgotPasswordInput {
  email: string;
}

const GENERIC_MESSAGE =
  'If an account exists with that email, a password reset link will be sent.';

export class ForgotPasswordUseCase implements IUseCase<ForgotPasswordInput, { message: string }> {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly emailSender: IEmailSender,
    private readonly frontendUrl: string
  ) {}

  public async execute(
    input: ForgotPasswordInput,
    _context?: IApplicationContext
  ): Promise<Result<{ message: string }>> {
    try {
      if (!input.email) {
        return Result.fail(new ValidationError('Please provide your email address.'));
      }

      const user = await this.userRepo.findByEmail(input.email.trim().toLowerCase());
      if (!user) {
        return Result.ok({ message: GENERIC_MESSAGE });
      }

      if (!user.isActive) {
        return Result.fail(
          new ValidationError('Account is not active. Please contact administrator.')
        );
      }

      const resetToken = generateOpaqueToken();
      user.requestPasswordReset(hashToken(resetToken), new Date(Date.now() + 10 * 60 * 1000));
      await this.userRepo.save(user);

      const resetURL = `${this.frontendUrl.replace(/\/$/, '')}/auth/resetpassword/${resetToken}`;

      try {
        await this.emailSender.send({
          to: user.email.value,
          subject: 'Password Reset Request (Valid for 10 minutes)',
          html: `
            <h2>Password Reset Request</h2>
            <p>Hello ${user.name},</p>
            <p>Click the link below to reset your password:</p>
            <p><a href="${resetURL}">Reset Password</a></p>
            <p>This link will expire in 10 minutes.</p>
          `,
        });
      } catch (err) {
        user.clearPasswordReset();
        await this.userRepo.save(user);
        return Result.fail(err as Error);
      }

      return Result.ok({
        message: 'Password reset link sent to your email. Valid for 10 minutes.',
      });
    } catch (err) {
      return Result.fail(err as Error);
    }
  }
}
