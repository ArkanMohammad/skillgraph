/**
 * Small request validators shared by the routes.
 * They answer 400 with a clear message before the route handler runs.
 */
import { Request, Response, NextFunction, RequestHandler } from 'express';

/** True for 1, 2, 3... (numbers or numeric strings, nothing else) */
export const isPositiveInt = (value: unknown): boolean => {
  if (typeof value !== 'number' && typeof value !== 'string') return false;
  if (typeof value === 'string' && value.trim() === '') return false;
  const number = Number(value);
  return Number.isInteger(number) && number > 0;
};

/** Checks that route parameters such as :goalId are positive integers */
export const positiveIntParam =
  (...names: string[]): RequestHandler =>
  (req: Request, res: Response, next: NextFunction): void => {
    const bad = names.filter((name) => !isPositiveInt(req.params[name]));
    if (bad.length > 0) {
      res.status(400).json({ message: `${bad.join(', ')} must be a positive integer` });
      return;
    }
    next();
  };

/** Checks that fields of the JSON body are positive integers */
export const positiveIntBody =
  (...names: string[]): RequestHandler =>
  (req: Request, res: Response, next: NextFunction): void => {
    const bad = names.filter((name) => !isPositiveInt(req.body?.[name]));
    if (bad.length > 0) {
      res.status(400).json({ message: `${bad.join(', ')} must be a positive integer` });
      return;
    }
    next();
  };