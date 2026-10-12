/**
 * Simple migration runner.
 *
 * - schema.sql is the baseline (migration 000). On a fresh database it is executed;
 *   on a database that already has the tables it is only marked as applied.
 * - Every file in backend/migrations/*.sql is applied once, in file name order.
 * - Applied migrations are remembered in the schema_migrations table.
 * - Plain SQL only (no DO $$ blocks, plpgsql can be blocked on some Windows machines).
 *
 * Run by hand:  npm run migrate
 * It also runs automatically when the server starts.
 */
import fs from 'node:fs';
import path from 'node:path';
import { pool, query } from './db';

// src/config (or dist/config) -> backend
const BACKEND_ROOT = path.resolve(__dirname, '..', '..');
const BASELINE_NAME = '000_baseline_schema';
const BASELINE_FILE = path.join(BACKEND_ROOT, 'schema.sql');
const MIGRATIONS_DIR = path.join(BACKEND_ROOT, 'migrations');

/** Runs one SQL file and records it, all in one transaction */
const applyFile = async (name: string, filePath: string): Promise<void> => {
  const sql = fs.readFileSync(filePath, 'utf8');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [name]);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

/** Applies every migration that was not applied yet. Returns the names it applied. */
export const runMigrations = async (): Promise<string[]> => {
  await query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name VARCHAR(200) PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  const done = await query<{ name: string }>('SELECT name FROM schema_migrations');
  const applied = new Set(done.rows.map((row) => row.name));
  const justApplied: string[] = [];

  // Baseline: create the tables on a fresh database, or just remember it on an existing one
  if (!applied.has(BASELINE_NAME)) {
    const existing = await query<{ found: string | null }>(
      `SELECT to_regclass('public.users') AS found`
    );
    if (existing.rows[0].found) {
      await query('INSERT INTO schema_migrations (name) VALUES ($1)', [BASELINE_NAME]);
    } else {
      await applyFile(BASELINE_NAME, BASELINE_FILE);
      justApplied.push(BASELINE_NAME);
    }
    applied.add(BASELINE_NAME);
  }

  const files = fs.existsSync(MIGRATIONS_DIR)
    ? fs.readdirSync(MIGRATIONS_DIR).filter((file) => file.endsWith('.sql')).sort()
    : [];

  for (const file of files) {
    const name = file.replace(/\.sql$/, '');
    if (applied.has(name)) continue;
    await applyFile(name, path.join(MIGRATIONS_DIR, file));
    justApplied.push(name);
  }

  return justApplied;
};

// Command line: npm run migrate
if (require.main === module) {
  runMigrations()
    .then((names) => {
      console.log(names.length > 0 ? `Applied: ${names.join(', ')}` : 'Database is up to date');
    })
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exitCode = 1;
    })
    .finally(() => pool.end());
}