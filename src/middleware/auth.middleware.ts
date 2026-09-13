import { Request, Response, NextFunction } from 'express';
import { ITokenService } from '../infrastructure/security/ITokenService';
import { RequestContextHolder } from './requestContext.middleware';
import { UnauthorizedError } from '../shared/errors';

export interface AuthenticatedUser {
  id: string;
  _id?: string;
  organizationId?: string;
  roles: string[];
  permissions: string[];
  isOwner?: boolean;
  isSuperAdmin?: boolean;
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

      const isOwner = Boolean(decoded.isOwner || (decoded.roles && decoded.roles.includes('owner')));
      const isSuperAdmin = Boolean(decoded.isSuperAdmin || (decoded.roles && decoded.roles.includes('superadmin')));

      const rolesSet = new Set<string>(decoded.roles || []);
      if (isOwner) {
        rolesSet.add('owner');
        rolesSet.add('superadmin');
      }
      if (isSuperAdmin) {
        rolesSet.add('superadmin');
      }
      if (rolesSet.size === 0) {
        rolesSet.add('user');
      }
      const roles = Array.from(rolesSet);

      const permissions = (isOwner || isSuperAdmin || (decoded.permissions && decoded.permissions.includes('*')))
        ? ['*']
        : (decoded.permissions || []);

      // organizationId MUST come from the JWT only — never from a client-supplied header.
      // Allowing x-organization-id header override would be a complete multi-tenant bypass (IDOR).
      const user: AuthenticatedUser = {
        id: decoded.userId,
        _id: decoded.userId,
        organizationId: decoded.organizationId,
        roles,
        permissions,
        isOwner,
        isSuperAdmin,
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
