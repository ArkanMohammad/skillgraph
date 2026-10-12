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

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** True for a UUID string such as the ids in the users table */
export const isUuid = (value: unknown): boolean => typeof value === 'string' && UUID_PATTERN.test(value);

/** Checks that route parameters such as :userId are UUIDs */
export const uuidParam =
  (...names: string[]): RequestHandler =>
  (req: Request, res: Response, next: NextFunction): void => {
    const bad = names.filter((name) => !isUuid(req.params[name]));
    if (bad.length > 0) {
      res.status(400).json({ message: `${bad.join(', ')} must be a valid id` });
      return;
    }
    next();
  };