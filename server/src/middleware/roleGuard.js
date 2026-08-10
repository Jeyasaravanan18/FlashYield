import { ForbiddenError } from "../utils/errors.js";
function roleGuard(...allowedRoles) {
  return (req, _res, next) => {
    if (!req.user) {
      next(new ForbiddenError("Authentication required before role check"));
      return;
    }
    if (!allowedRoles.includes(req.user.role)) {
      next(
        new ForbiddenError(
          `Role '${req.user.role}' is not authorized for this resource`
        )
      );
      return;
    }
    next();
  };
}
export {
  roleGuard
};
