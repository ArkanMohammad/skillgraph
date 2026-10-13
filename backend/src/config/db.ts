/**
 * PostgreSQL connection using a Connection Pool
 */
import { Pool, QueryResult, QueryResultRow } from 'pg';
import { env } from './env';

export const pool = new Pool({
  connectionString: env.databaseUrl,
  max: 10, // Max concurrent connections
  idleTimeoutMillis: 30000,
});

// Log idle connection errors without crashing the current request
pool.on('error', (err) => {
  console.error('Unexpected error on an idle database connection:', err);
});

/** Run a query with optional parameters */
export const query = <T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> => {
  return pool.query<T>(text, params);
};