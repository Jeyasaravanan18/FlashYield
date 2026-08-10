import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { UnauthorizedError } from "../utils/errors.js";
function authenticate(req, _res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedError("Missing or malformed authorization header");
    }
    const token = authHeader.split(" ")[1];
    if (!token) {
      throw new UnauthorizedError("No token provided");
    }
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
    req.user = {
      userId: decoded.userId,
      role: decoded.role,
      email: decoded.email
    };
    next();
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      next(err);
      return;
    }
    if (err instanceof jwt.TokenExpiredError) {
      next(new UnauthorizedError("Access token has expired"));
      return;
    }
    if (err instanceof jwt.JsonWebTokenError) {
      next(new UnauthorizedError("Invalid access token"));
      return;
    }
    next(err);
  }
}
export {
  authenticate
};
