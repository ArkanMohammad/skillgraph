/**
 * حماية المسارات: التحقق من JWT والصلاحيات (RBAC)
 * Route protection: JWT verification and role-based access
 */
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AuthPayload, UserRole } from '../models';

/** Verify Bearer JWT and attach user to req / التحقق من التوكن وإرفاق المستخدم */
export const authenticateJWT = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const header = req.headers.authorization; // Expected: "Bearer <token>" / الشكل المتوقع

  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Missing or invalid token / التوكن مفقود أو غير صالح' });
    return;
  }

  const token = header.slice(7); // Strip "Bearer " / إزالة البادئة

  try {
    const decoded = jwt.verify(token, env.jwtSecret) as AuthPayload;
    req.user = { id: decoded.id, email: decoded.email, role: decoded.role };
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token / التوكن غير صالح أو منتهي' });
  }
};

/** Restrict route to given roles / تقييد المسار حسب الدور */
export const requireRole = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized / غير مصرّح' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ message: 'Forbidden / لا تملك صلاحية الوصول' });
      return;
    }

    next();
  };
};
