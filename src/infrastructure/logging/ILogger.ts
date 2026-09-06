export type LogMetadata = Record<string, unknown>;

export interface ILogger {
  info(message: string, meta?: LogMetadata): void;
  warn(message: string, meta?: LogMetadata): void;
  error(message: string, meta?: LogMetadata): void;
  debug(message: string, meta?: LogMetadata): void;
  child(context: LogMetadata): ILogger;
}
