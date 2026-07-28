import { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '../utils/errors';
import { UserRole } from '../types';

/**
 * Factory function that returns middleware restricting access to specified roles.
 * Must be used after the `authenticate` middleware.
 *
 * Usage: `router.get('/admin-only', authenticate, roleGuard('admin'), handler)`
 */
export function roleGuard(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new ForbiddenError('Authentication required before role check'));
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(
        new ForbiddenError(
          `Role '${req.user.role}' is not authorized for this resource`,
        ),
      );
      return;
    }

    next();
  };
}
