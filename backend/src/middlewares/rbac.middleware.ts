import { NextFunction, Request, Response } from 'express';
import { ForbiddenError, UnauthorizedError } from '../common/errors/AppError';
import { Permission, Role, roleHasPermission } from '../common/constants/roles';

/** Guards a route to a set of roles. */
export function authorize(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) throw new UnauthorizedError();
    if (!roles.includes(req.user.role)) {
      throw new ForbiddenError('Insufficient role for this resource');
    }
    next();
  };
}

/** Guards a route by granular permission. */
export function requirePermission(...permissions: Permission[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) throw new UnauthorizedError();
    const allowed = permissions.every((p) => roleHasPermission(req.user!.role, p));
    if (!allowed) throw new ForbiddenError('Missing required permission');
    next();
  };
}
