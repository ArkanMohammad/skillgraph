/**
 * Route protection: JWT verification and role-based access
 */
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AuthPayload, UserRole } from '../models';

/** Name of the cookie that holds the JWT */
export const AUTH_COOKIE = 'token';

/** Read the token from the Bearer header or from the cookie */
const extractToken = (req: Request): string | null => {
  const header = req.headers.authorization; // Expected: "Bearer <token>"
  if (header && header.startsWith('Bearer ')) {
    return header.slice(7); // Strip "Bearer "
  }
  const fromCookie = req.cookies?.[AUTH_COOKIE];
  return typeof fromCookie === 'string' && fromCookie ? fromCookie : null;
};

/** Verify JWT and attach user to req */
export const authenticateJWT = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const token = extractToken(req);

  if (!token) {
    res.status(401).json({ message: 'Missing or invalid token' });
    return;
  }

  try {
    const decoded = jwt.verify(token, env.jwtSecret) as AuthPayload;
    req.user = { id: decoded.id, email: decoded.email, role: decoded.role };
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

/** Restrict route to given roles */
export const requireRole = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    next();
  };
};