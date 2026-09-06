import { RequestContextHolder, RequestContextData } from '../../../../middleware/requestContext.middleware';

export interface HrmsRequestContext extends RequestContextData {
  organizationId: string;
  userId: string;
}

export function getHrmsContext(): HrmsRequestContext {
  const ctx = RequestContextHolder.get();
  return {
    requestId: ctx?.requestId || 'req-unknown',
    correlationId: ctx?.correlationId || 'corr-unknown',
    roles: ctx?.roles || [],
    permissions: ctx?.permissions || [],
    startTime: ctx?.startTime || Date.now(),
    ipAddress: ctx?.ipAddress,
    userAgent: ctx?.userAgent,
    organizationId: ctx?.organizationId || 'default',
    userId: ctx?.userId || 'system',
  };
}
