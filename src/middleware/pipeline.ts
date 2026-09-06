import express, { Express } from 'express';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { EnvironmentConfig } from '../config/environment';
import { ILogger } from '../infrastructure/logging/ILogger';
import { correlationIdMiddleware } from './correlationId.middleware';
import { requestContextMiddleware } from './requestContext.middleware';
import { createSecurityHeadersMiddleware } from './securityHeaders.middleware';
import { createCorsMiddleware } from './cors.middleware';
import { createRateLimiter } from './rateLimit.middleware';
import { createSanitizationMiddleware } from './sanitization.middleware';
import { createRequestLoggerMiddleware } from './requestLogger.middleware';
import { createTimeoutMiddleware } from './timeout.middleware';
import { notFoundMiddleware } from './notFound.middleware';
import { createErrorHandlerMiddleware } from './errorHandler.middleware';

export interface MiddlewarePipelineDependencies {
  config: EnvironmentConfig;
  logger: ILogger;
}

export class MiddlewarePipeline {
  public static configurePreRouting(app: Express, deps: MiddlewarePipelineDependencies): void {
    // 1. Correlation & Request Tracking
    app.use(correlationIdMiddleware);
    app.use(requestContextMiddleware);

    // 2. Security Headers & CORS
    app.use(createSecurityHeadersMiddleware());
    app.use(createCorsMiddleware(deps.config.CORS_ORIGINS));

    // 3. Performance & Payload Compression
    app.use(compression());

    // 4. Rate Limiting
    app.use(
      createRateLimiter({
        windowMs: deps.config.RATE_LIMIT_WINDOW_MS,
        max: deps.config.RATE_LIMIT_MAX_REQUESTS,
      })
    );

    // 5. Body Parsing & Cookies (refresh-token HttpOnly cookie)
    app.use(cookieParser());
    app.use(express.json({ limit: '2mb' }));
    app.use(express.urlencoded({ extended: true, limit: '2mb' }));

    // 6. Security Sanitization (NoSQL Injection & Parameter Pollution)
    app.use(createSanitizationMiddleware());

    // 7. Structured Request Logging
    app.use(createRequestLoggerMiddleware(deps.logger));

    // 8. Request Timeout Guard
    app.use(createTimeoutMiddleware(deps.config.REQUEST_TIMEOUT_MS));
  }

  public static configurePostRouting(app: Express, deps: MiddlewarePipelineDependencies): void {
    // 404 Route Not Found
    app.use(notFoundMiddleware);

    // Central Error Handling
    app.use(createErrorHandlerMiddleware(deps.logger));
  }
}
