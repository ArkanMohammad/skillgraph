/**
 * إعداد اتصال PostgreSQL عبر Connection Pool
 * PostgreSQL connection using a Connection Pool
 */
import { Pool, QueryResult, QueryResultRow } from 'pg';
import { env } from './env';

export const pool = new Pool({
  connectionString: env.databaseUrl,
  max: 10, // Max concurrent connections / أقصى عدد اتصالات متزامنة
  idleTimeoutMillis: 30000,
});

// Log idle connection errors without crashing the current request
// تسجيل أخطاء الاتصالات الخاملة دون إسقاط الطلب الحالي
pool.on('error', (err) => {
  console.error('خطأ غير متوقع في اتصال قاعدة البيانات:', err);
});

/** Run a query with optional parameters / تنفيذ استعلام مع معاملات اختيارية */
export const query = <T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> => {
  return pool.query<T>(text, params);
};
