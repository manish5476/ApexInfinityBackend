import { IUseCase, IApplicationContext } from '../../../../core/application/IUseCase';
import { IUserRepository } from '../../domain/ports/IUserRepository';
import { IEmailSender } from '../../../../infrastructure/email/IEmailSender';
import { generateOpaqueToken, hashToken } from '../../../../infrastructure/security/hashToken';
import { Result } from '../../../../shared/result';
import { UnauthorizedError, NotFoundError, ValidationError } from '../../../../shared/errors';

export class SendVerificationEmailUseCase implements IUseCase<void, { message: string }> {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly emailSender: IEmailSender,
    private readonly frontendUrl: string
  ) {}

  public async execute(
    _input: void,
    context?: IApplicationContext
  ): Promise<Result<{ message: string }>> {
    try {
      if (!context?.userId) {
        return Result.fail(new UnauthorizedError('User not authenticated'));
      }

      const user = await this.userRepo.findById(context.userId);
      if (!user) {
        return Result.fail(new NotFoundError('User', context.userId));
      }

      const verificationToken = generateOpaqueToken();
      try {
        user.requestEmailVerification(
          hashToken(verificationToken),
          new Date(Date.now() + 24 * 60 * 60 * 1000)
        );
      } catch (err) {
        return Result.fail(new ValidationError((err as Error).message));
      }

      await this.userRepo.save(user);

      const verificationURL = `${this.frontendUrl.replace(/\/$/, '')}/auth/verify-email/${verificationToken}`;
      await this.emailSender.send({
        to: user.email.value,
        subject: 'Verify Your Email Address',
        html: `
          <h2>Email Verification</h2>
          <p>Hello ${user.name},</p>
          <p>Please verify your email address by clicking the link below:</p>
          <p><a href="${verificationURL}">Verify Email</a></p>
          <p>This link will expire in 24 hours.</p>
        `,
      });

      return Result.ok({ message: 'Verification email sent successfully.' });
    } catch (err) {
      return Result.fail(err as Error);
    }
  }
}
