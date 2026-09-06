import rateLimit, { RateLimitRequestHandler } from 'express-rate-limit';
import { Request } from 'express';

export interface RateLimitOptions {
  windowMs?: number;
  max?: number;
  message?: string;
}

export function createRateLimiter(options: RateLimitOptions = {}): RateLimitRequestHandler {
  const windowMs = options.windowMs || 60 * 1000;
  const max = options.max || 100;
  const message = options.message || 'Too many requests. Please try again later.';

  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    validate: { keyGeneratorIpFallback: false },
    keyGenerator: (req: Request) => {
      // Prioritize authenticated user/tenant over IP
      const customReq = req as unknown as { user?: { id?: string; organizationId?: string } };
      if (customReq.user?.organizationId && customReq.user?.id) {
        return `${customReq.user.organizationId}:${customReq.user.id}`;
      }
      return req.ip || 'anonymous';
    },
    message: {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message,
      },
    },
  });
}
