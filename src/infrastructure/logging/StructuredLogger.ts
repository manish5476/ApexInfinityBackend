import winston from 'winston';
import { ILogger, LogMetadata } from './ILogger';

const SENSITIVE_KEYS = new Set([
  'password',
  'token',
  'authorization',
  'refreshtoken',
  'accesstoken',
  'secret',
  'creditcard',
  'cardnumber',
  'cvv',
  'bankaccount',
  'salary',
  'ssn',
]);

function sanitizeMeta(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeMeta);
  }
  if (typeof value === 'object') {
    const cleaned: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (SENSITIVE_KEYS.has(k.toLowerCase())) {
        cleaned[k] = '[REDACTED]';
      } else {
        cleaned[k] = sanitizeMeta(v);
      }
    }
    return cleaned;
  }
  return value;
}

export class StructuredLogger implements ILogger {
  private readonly logger: winston.Logger;
  private readonly defaultMeta: LogMetadata;

  constructor(logLevel = 'info', defaultMeta: LogMetadata = {}) {
    this.defaultMeta = defaultMeta;

    this.logger = winston.createLogger({
      level: logLevel,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console({
          format: process.env.NODE_ENV === 'production'
            ? winston.format.json()
            : winston.format.combine(
                winston.format.colorize(),
                winston.format.printf(({ level, message, timestamp, ...meta }) => {
                  const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
                  return `[${timestamp}] ${level}: ${message}${metaStr}`;
                })
              ),
        }),
      ],
    });
  }

  public info(message: string, meta?: LogMetadata): void {
    this.logger.info(message, this.buildMeta(meta));
  }

  public warn(message: string, meta?: LogMetadata): void {
    this.logger.warn(message, this.buildMeta(meta));
  }

  public error(message: string, meta?: LogMetadata): void {
    this.logger.error(message, this.buildMeta(meta));
  }

  public debug(message: string, meta?: LogMetadata): void {
    this.logger.debug(message, this.buildMeta(meta));
  }

  public child(context: LogMetadata): ILogger {
    return new StructuredLogger(this.logger.level, {
      ...this.defaultMeta,
      ...context,
    });
  }

  private buildMeta(meta?: LogMetadata): LogMetadata {
    const merged = { ...this.defaultMeta, ...(meta || {}) };
    return sanitizeMeta(merged) as LogMetadata;
  }
}
