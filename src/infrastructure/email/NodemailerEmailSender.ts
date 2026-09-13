import nodemailer from 'nodemailer';
import { IEmailSender, EmailMessage } from './IEmailSender';
import { ILogger } from '../logging/ILogger';

export interface SmtpConfig {
  host: string;
  port: number;
  secure?: boolean;
  username?: string;
  password?: string;
  fromName?: string;
  fromEmail?: string;
}

export class NodemailerEmailSender implements IEmailSender {
  private readonly transporter: nodemailer.Transporter;
  private readonly logger: ILogger;
  private readonly fromAddress: string;

  constructor(config: SmtpConfig, logger: ILogger) {
    this.logger = logger;
    this.fromAddress =
      config.fromName && config.fromEmail
        ? `"${config.fromName}" <${config.fromEmail}>`
        : config.fromEmail || config.username || 'noreply@apex-infinity.com';

    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure ?? config.port === 465,
      auth:
        config.username && config.password
          ? {
              user: config.username,
              pass: config.password,
            }
          : undefined,
    });
  }

  public async send(message: EmailMessage): Promise<void> {
    try {
      const info = await this.transporter.sendMail({
        from: this.fromAddress,
        to: message.to,
        subject: message.subject,
        html: message.html,
      });

      this.logger.info('[email] Email sent successfully via SMTP', {
        to: message.to,
        subject: message.subject,
        messageId: info.messageId,
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`[email] Failed to send email via SMTP: ${msg}`, {
        to: message.to,
        subject: message.subject,
      });
      throw error;
    }
  }
}
