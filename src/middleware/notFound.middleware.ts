import { Request, Response } from 'express';
import { ApiResponseFactory } from '../shared/contracts';

export function notFoundMiddleware(req: Request, res: Response): void {
  res.status(404).json(
    ApiResponseFactory.error(
      'ROUTE_NOT_FOUND',
      `Cannot ${req.method} ${req.originalUrl}`
    )
  );
}
