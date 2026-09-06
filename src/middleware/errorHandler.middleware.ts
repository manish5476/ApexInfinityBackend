import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppBaseError } from '../shared/errors';
import { ApiResponseFactory } from '../shared/contracts';
import { ILogger } from '../infrastructure/logging/ILogger';

export function createErrorHandlerMiddleware(logger?: ILogger) {
  return (err: unknown, req: Request, res: Response, _next: NextFunction): void => {
    // 1. Handled Operational Errors (AppBaseError)
    if (err instanceof AppBaseError) {
      logger?.warn(`[error:operational] ${err.name} (${err.code}): ${err.message}`, {
        url: req.originalUrl,
        statusCode: err.statusCode,
        code: err.code,
        details: err.details,
      });

      res.status(err.statusCode).json(
        ApiResponseFactory.error(err.code, err.message, err.details)
      );
      return;
    }

    // 2. Zod Validation Errors
    if (err instanceof ZodError) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of err.issues) {
        const path = issue.path.join('.') || 'root';
        if (!fieldErrors[path]) {
          fieldErrors[path] = [];
        }
        fieldErrors[path].push(issue.message);
      }

      logger?.warn(`[error:validation] Zod validation failed on ${req.originalUrl}`, {
        errors: fieldErrors,
      });

      res.status(400).json(
        ApiResponseFactory.error('VALIDATION_ERROR', 'Input validation failed.', fieldErrors)
      );
      return;
    }

    // 3. MongoDB Duplicate Key (E11000)
    const maybeMongoError = err as { code?: number; keyValue?: Record<string, unknown> };
    if (maybeMongoError?.code === 11000 && maybeMongoError.keyValue) {
      const field = Object.keys(maybeMongoError.keyValue)[0] || 'field';
      const value = maybeMongoError.keyValue[field];
      const message = `A record with ${field} '${value}' already exists.`;

      logger?.warn(`[error:conflict] Duplicate key error on ${req.originalUrl}: ${message}`);
      res.status(409).json(ApiResponseFactory.error('DUPLICATE_RESOURCE', message));
      return;
    }

    // 4. Unexpected / Unhandled Internal Errors
    const internalError = err instanceof Error ? err : new Error(String(err));
    logger?.error(`[error:unhandled] Unexpected internal server error: ${internalError.message}`, {
      stack: internalError.stack,
      url: req.originalUrl,
      method: req.method,
    });

    const isProduction = process.env.NODE_ENV === 'production';
    const message = isProduction
      ? 'An unexpected internal error occurred. Please contact support.'
      : internalError.message;

    res.status(500).json(
      ApiResponseFactory.error(
        'INTERNAL_SERVER_ERROR',
        message,
        isProduction ? undefined : { stack: internalError.stack }
      )
    );
  };
}
