import helmet from 'helmet';
import { RequestHandler } from 'express';

export function createSecurityHeadersMiddleware(): RequestHandler {
  return helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  });
}
