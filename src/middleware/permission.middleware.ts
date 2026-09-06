import { Request, Response, NextFunction } from 'express';
import { ForbiddenError, UnauthorizedError } from '../shared/errors';
import { AuthenticatedUser } from './auth.middleware';

export function requireRole(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as unknown as { user?: AuthenticatedUser }).user;

    if (!user) {
      return next(new UnauthorizedError('Authentication required to access this resource.'));
    }

    // Superadmins bypass role checks
    if (user.roles.includes('superadmin')) {
      return next();
    }

    const hasRole = user.roles.some((role) => allowedRoles.includes(role));
    if (!hasRole) {
      return next(
        new ForbiddenError(`Required role missing. Required: [${allowedRoles.join(', ')}]`)
      );
    }

    next();
  };
}

export function requirePermission(requiredPermissions: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as unknown as { user?: AuthenticatedUser }).user;

    if (!user) {
      return next(new UnauthorizedError('Authentication required to access this resource.'));
    }

    // Superadmins bypass permission checks
    if (user.roles.includes('superadmin')) {
      return next();
    }

    const hasAllPermissions = requiredPermissions.every((perm) =>
      user.permissions.includes(perm)
    );

    if (!hasAllPermissions) {
      return next(
        new ForbiddenError(
          `Insufficient permissions. Required: [${requiredPermissions.join(', ')}]`
        )
      );
    }

    next();
  };
}

/**
 * Enforces that the request has an active organization scope.
 */
export function requireOrganizationScope() {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as unknown as { user?: AuthenticatedUser }).user;

    if (!user || !user.organizationId) {
      return next(
        new ForbiddenError('Active organization scope is required to perform this action.')
      );
    }

    next();
  };
}
