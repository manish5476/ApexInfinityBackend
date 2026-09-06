import { Request, Response, NextFunction } from 'express';
import { ILogger } from '../infrastructure/logging/ILogger';
import { RequestContextHolder } from './requestContext.middleware';

export function createRequestLoggerMiddleware(logger: ILogger) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const startTime = Date.now();

    res.on('finish', () => {
      const durationMs = Date.now() - startTime;
      const ctx = RequestContextHolder.get();

      const logData = {
        method: req.method,
        url: req.originalUrl || req.url,
        statusCode: res.statusCode,
        durationMs,
        correlationId: ctx?.correlationId,
        requestId: ctx?.requestId,
        organizationId: ctx?.organizationId,
        userId: ctx?.userId,
        ip: req.ip,
      };

      if (res.statusCode >= 500) {
        logger.error(`HTTP ${req.method} ${req.originalUrl} ${res.statusCode} (${durationMs}ms)`, logData);
      } else if (res.statusCode >= 400) {
        logger.warn(`HTTP ${req.method} ${req.originalUrl} ${res.statusCode} (${durationMs}ms)`, logData);
      } else {
        logger.info(`HTTP ${req.method} ${req.originalUrl} ${res.statusCode} (${durationMs}ms)`, logData);
      }
    });

    next();
  };
}
