import { IEmailSender, EmailMessage } from './IEmailSender';
import { ILogger } from '../logging/ILogger';

/**
 * Development / fallback mailer. Logs outbound mail instead of sending SMTP.
 * Swap for a Nodemailer adapter in production composition when SMTP is configured.
 */
export class LoggerEmailSender implements IEmailSender {
  private readonly logger: ILogger;

  constructor(logger: ILogger) {
    this.logger = logger;
  }

  public async send(message: EmailMessage): Promise<void> {
    this.logger.info('[email] Outbound message queued (logger transport)', {
      to: message.to,
      subject: message.subject,
    });
  }
}
