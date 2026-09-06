import { Request, Response, NextFunction } from 'express';

export function createTimeoutMiddleware(timeoutMs = 30000) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const timer = setTimeout(() => {
      if (!res.headersSent) {
        res.status(504).json({
          success: false,
          error: {
            code: 'GATEWAY_TIMEOUT',
            message: `Request timed out after ${timeoutMs}ms.`,
          },
        });
      }
    }, timeoutMs);

    res.on('finish', () => clearTimeout(timer));
    res.on('close', () => clearTimeout(timer));

    next();
  };
}
