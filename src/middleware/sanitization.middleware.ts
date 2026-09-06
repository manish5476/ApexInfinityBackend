import { Request, Response, NextFunction } from 'express';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';

export function createSanitizationMiddleware() {
  const sanitizeMongo = mongoSanitize({
    replaceWith: '_',
    onSanitize: ({ req, key }) => {
      console.warn(`[security] Sanitized potentially dangerous key '${key}' in request from ${req.ip}`);
    },
  });

  const preventHpp = hpp();

  return (req: Request, res: Response, next: NextFunction): void => {
    sanitizeMongo(req, res, (err) => {
      if (err) return next(err);
      preventHpp(req, res, next);
    });
  };
}
