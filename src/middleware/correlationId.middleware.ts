import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

export const CORRELATION_ID_HEADER = 'x-correlation-id';
export const REQUEST_ID_HEADER = 'x-request-id';

export function correlationIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const correlationId =
    (req.headers[CORRELATION_ID_HEADER] as string) ||
    (req.headers[REQUEST_ID_HEADER] as string) ||
    uuidv4();

  const requestId = uuidv4();

  // Attach to request object
  (req as unknown as { correlationId: string; requestId: string }).correlationId = correlationId;
  (req as unknown as { correlationId: string; requestId: string }).requestId = requestId;

  // Set outgoing headers
  res.setHeader(CORRELATION_ID_HEADER, correlationId);
  res.setHeader(REQUEST_ID_HEADER, requestId);

  next();
}
