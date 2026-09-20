/**
 * معالج الأخطاء العام — يُسجَّل في نهاية سلسلة الـ Middlewares
 */
import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error(err);
  res.status(500).json({ message: 'حدث خطأ في الخادم' });
};
