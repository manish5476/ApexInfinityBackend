import cors from 'cors';
import { RequestHandler } from 'express';

export function createCorsMiddleware(allowedOrigins: string[]): RequestHandler {
  return cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS policy blocked access from origin: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'x-request-id',
      'x-correlation-id',
      'x-organization-id',
      'x-branch-id',
    ],
    exposedHeaders: ['x-request-id', 'x-correlation-id'],
  });
}
