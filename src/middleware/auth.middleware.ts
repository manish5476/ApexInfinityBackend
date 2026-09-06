import { Request, Response, NextFunction } from 'express';
import { ITokenService } from '../infrastructure/security/ITokenService';
import { RequestContextHolder } from './requestContext.middleware';
import { UnauthorizedError } from '../shared/errors';

export interface AuthenticatedUser {
  id: string;
  organizationId?: string;
  roles: string[];
  permissions: string[];
}

export function createAuthMiddleware(tokenService: ITokenService, isOptional = false) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      if (isOptional) {
        return next();
      }
      return next(new UnauthorizedError('Missing or malformed Authorization header.'));
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      if (isOptional) return next();
      return next(new UnauthorizedError('Missing token string.'));
    }

    try {
      const decoded = tokenService.verifyToken(token);

      // Support explicit tenant switching via x-organization-id header if authorized
      const targetOrgId =
        (req.headers['x-organization-id'] as string) || decoded.organizationId;

      const user: AuthenticatedUser = {
        id: decoded.userId,
        organizationId: targetOrgId,
        roles: decoded.roles || [],
        permissions: decoded.permissions || [],
      };

      // Attach to request
      (req as unknown as { user: AuthenticatedUser }).user = user;

      // Update RequestContextHolder for application layer
      RequestContextHolder.setAuth({
        userId: user.id,
        organizationId: user.organizationId,
        roles: user.roles,
        permissions: user.permissions,
      });

      next();
    } catch (err) {
      if (isOptional) return next();
      next(err);
    }
  };
}
