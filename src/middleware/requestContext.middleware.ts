import { AsyncLocalStorage } from 'async_hooks';
import { Request, Response, NextFunction } from 'express';
import { IApplicationContext } from '../core/application/IUseCase';

export interface RequestContextData extends IApplicationContext {
  ipAddress?: string;
  userAgent?: string;
  startTime: number;
}

export class RequestContextHolder {
  private static readonly asyncLocalStorage = new AsyncLocalStorage<RequestContextData>();

  public static run<R>(context: RequestContextData, fn: () => R): R {
    return this.asyncLocalStorage.run(context, fn);
  }

  public static get(): RequestContextData | undefined {
    return this.asyncLocalStorage.getStore();
  }

  public static getRequired(): RequestContextData {
    const ctx = this.get();
    if (!ctx) {
      throw new Error('RequestContext is not available in the current asynchronous execution scope.');
    }
    return ctx;
  }

  public static setAuth(auth: {
    userId: string;
    organizationId?: string;
    roles?: string[];
    permissions?: string[];
  }): void {
    const ctx = this.get();
    if (ctx) {
      ctx.userId = auth.userId;
      ctx.organizationId = auth.organizationId;
      ctx.roles = auth.roles || [];
      ctx.permissions = auth.permissions || [];
    }
  }
}

export function requestContextMiddleware(req: Request, res: Response, next: NextFunction): void {
  const customReq = req as unknown as { correlationId?: string; requestId?: string };
  const correlationId = customReq.correlationId || (req.headers['x-correlation-id'] as string) || 'unknown';
  const requestId = customReq.requestId || (req.headers['x-request-id'] as string) || 'unknown';

  const contextData: RequestContextData = {
    requestId,
    correlationId,
    roles: [],
    permissions: [],
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
    startTime: Date.now(),
  };

  RequestContextHolder.run(contextData, () => {
    next();
  });
}
