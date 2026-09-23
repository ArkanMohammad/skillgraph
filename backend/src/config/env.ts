/**
 * تحميل متغيرات البيئة والتحقق من وجود القيم الإلزامية
 * Load env vars and fail if required values are missing
 */
import dotenv from 'dotenv';

dotenv.config();

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`المتغير ${key} غير موجود في ملف .env`);
  }
  return value;
}

export const env = {
  port: Number(process.env.PORT) || 3000,
  databaseUrl: requireEnv('DATABASE_URL'),
  jwtSecret: requireEnv('JWT_SECRET'),
};
