/**
 * فحص صحة السيرفر واتصال قاعدة البيانات
 * Health check for the server and database connection
 */
import { Request, Response } from 'express';
import { pool } from '../config/db';

export const healthCheck = async (_req: Request, res: Response): Promise<void> => {
  try {
    await pool.query('SELECT 1');
    res.status(200).json({
      status: 'ok',
      service: 'SkillGraph',
      database: 'connected',
    });
  } catch {
    res.status(503).json({
      status: 'error',
      service: 'SkillGraph',
      database: 'disconnected',
    });
  }
};
