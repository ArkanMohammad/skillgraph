/**
 * Deployment readiness check. Run it on the machine (or in the environment) you deploy to:
 *   npm run check:deploy
 *
 * Optional: API_URL=https://your-api.example.com/api to also check a running server
 * (health endpoint, CORS for CLIENT_URL, unauthenticated access to protected routes).
 *
 * It prints PASS / WARN / FAIL per check and exits with 1 when anything FAILS.
 * It never prints secret values.
 */
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

type Level = 'PASS' | 'WARN' | 'FAIL';
const results: { level: Level; name: string; detail: string }[] = [];

const report = (level: Level, name: string, detail = ''): void => {
  results.push({ level, name, detail });
  console.log(`${level.padEnd(5)} ${name}${detail ? `: ${detail}` : ''}`);
};

const EXAMPLE_SECRETS = ['change_this_to_a_long_random_secret', 'secret', 'changeme', 'password'];
const BACKEND_ROOT = path.resolve(__dirname, '..', '..');

/** Environment variables */
const checkEnvironment = (): void => {
  for (const key of ['DATABASE_URL', 'JWT_SECRET', 'CLIENT_URL']) {
    if (process.env[key]) report('PASS', `env ${key} is set`);
    else report('FAIL', `env ${key} is set`, 'missing');
  }

  const secret = process.env.JWT_SECRET ?? '';
  if (secret) {
    if (EXAMPLE_SECRETS.includes(secret.toLowerCase())) report('FAIL', 'JWT_SECRET is not the example value');
    else if (secret.length < 32) report('WARN', 'JWT_SECRET length', `${secret.length} characters, use at least 32`);
    else report('PASS', 'JWT_SECRET is long and not the example value');
  }

  const production = process.env.NODE_ENV === 'production';
  if (production) report('PASS', 'NODE_ENV is production', 'cookies are Secure and only the CLIENT_URL origin is allowed');
  else report('WARN', 'NODE_ENV is production', `it is "${process.env.NODE_ENV ?? 'not set'}", set it on the server`);

  const clientUrl = process.env.CLIENT_URL ?? '';
  if (clientUrl) {
    if (production && /localhost|127\.0\.0\.1/.test(clientUrl)) {
      report('FAIL', 'CLIENT_URL points to the deployed frontend', `it is "${clientUrl}"`);
    } else if (production && !clientUrl.startsWith('https://')) {
      report('WARN', 'CLIENT_URL uses https', `it is "${clientUrl}", Secure cookies need https`);
    } else if (clientUrl.endsWith('/')) {
      report('FAIL', 'CLIENT_URL has no trailing slash', 'CORS compares the exact origin');
    } else {
      report('PASS', 'CLIENT_URL looks right');
    }
  }

  if (fs.existsSync(path.join(BACKEND_ROOT, '.env'))) {
    const gitignore = fs.existsSync(path.join(BACKEND_ROOT, '.gitignore'))
      ? fs.readFileSync(path.join(BACKEND_ROOT, '.gitignore'), 'utf8')
      : '';
    if (/^\.env\s*$/m.test(gitignore)) report('PASS', '.env is ignored by git');
    else report('FAIL', '.env is ignored by git', 'add ".env" to backend/.gitignore');
  }
};

/** Database, migrations and seed */
const checkDatabase = async (): Promise<void> => {
  if (!process.env.DATABASE_URL) return;
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 5000 });
  try {
    await pool.query('SELECT 1');
    report('PASS', 'database connection');
  } catch (err) {
    report('FAIL', 'database connection', err instanceof Error ? err.message : String(err));
    await pool.end();
    return;
  }

  try {
    const tables = [
      'users', 'goals', 'skills', 'goal_skills', 'skill_dependencies',
      'user_goals', 'user_skills', 'assessments', 'assessment_answers', 'questions', 'question_options',
    ];
    const found = await pool.query<{ table_name: string }>(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`
    );
    const existing = new Set(found.rows.map((row) => row.table_name));
    const missing = tables.filter((table) => !existing.has(table));
    if (missing.length === 0) report('PASS', 'all tables exist');
    else report('FAIL', 'all tables exist', `missing: ${missing.join(', ')} (run npm run migrate)`);

    // Every file in migrations/ must be recorded in schema_migrations
    const dir = path.join(BACKEND_ROOT, 'migrations');
    const files = fs.existsSync(dir)
      ? fs.readdirSync(dir).filter((file) => file.endsWith('.sql')).map((file) => file.replace(/\.sql$/, ''))
      : [];
    if (existing.has('schema_migrations')) {
      const done = await pool.query<{ name: string }>('SELECT name FROM schema_migrations');
      const applied = new Set(done.rows.map((row) => row.name));
      const pending = files.filter((name) => !applied.has(name));
      if (pending.length === 0) report('PASS', 'migrations are up to date', `${files.length} file(s)`);
      else report('FAIL', 'migrations are up to date', `pending: ${pending.join(', ')} (run npm run migrate)`);
    } else {
      report('FAIL', 'migrations are up to date', 'schema_migrations table not found (run npm run migrate)');
    }

    if (existing.has('goals') && existing.has('skills')) {
      const goals = Number((await pool.query('SELECT COUNT(*) AS total FROM goals')).rows[0].total);
      const links = Number((await pool.query('SELECT COUNT(*) AS total FROM goal_skills')).rows[0].total);
      if (goals >= 7) report('PASS', 'seed goals', `${goals} goals`);
      else report('FAIL', 'seed goals', `${goals} goals, expected 7 (start the server once to seed)`);
      if (links > 0) report('PASS', 'goals have skills', `${links} goal-skill links`);
      else report('FAIL', 'goals have skills', 'goal_skills is empty');

      const empty = await pool.query<{ name: string }>(
        `SELECT g.name FROM goals g LEFT JOIN goal_skills gs ON gs.goal_id = g.id
         GROUP BY g.id, g.name HAVING COUNT(gs.skill_id) = 0`
      );
      if (empty.rowCount === 0) report('PASS', 'no goal without skills');
      else report('WARN', 'no goal without skills', empty.rows.map((row) => row.name).join(', '));
    }

    if (existing.has('questions')) {
      const noQuestions = await pool.query<{ name: string }>(
        `SELECT s.name FROM skills s LEFT JOIN questions q ON q.skill_id = s.id
         GROUP BY s.id, s.name HAVING COUNT(q.id) = 0`
      );
      if (noQuestions.rowCount === 0) report('PASS', 'every skill has assessment questions');
      else report('WARN', 'every skill has assessment questions', `${noQuestions.rowCount} skill(s) without questions`);
    }

    if (existing.has('users')) {
      const admins = Number((await pool.query(`SELECT COUNT(*) AS total FROM users WHERE role = 'ADMIN'`)).rows[0].total);
      if (admins > 0) report('PASS', 'at least one admin exists', `${admins}`);
      else report('WARN', 'at least one admin exists', `none yet: UPDATE users SET role = 'ADMIN' WHERE email = '...'`);
      const leftovers = Number(
        (await pool.query(`SELECT COUNT(*) AS total FROM users WHERE email LIKE 'apitest\\_%' OR email LIKE 'd12test\\_%'`)).rows[0].total
      );
      if (leftovers === 0) report('PASS', 'no test users left in the database');
      else report('WARN', 'no test users left in the database', `${leftovers} test user(s)`);
    }
  } catch (err) {
    report('FAIL', 'database checks', err instanceof Error ? err.message : String(err));
  } finally {
    await pool.end();
  }
};

/** A running server: health, CORS and protection of the routes */
const checkServer = async (): Promise<void> => {
  const apiUrl = (process.env.API_URL ?? '').replace(/\/$/, '');
  if (!apiUrl) {
    report('WARN', 'running server checks', 'skipped, set API_URL=https://host/api to include them');
    return;
  }

  try {
    const health = await fetch(`${apiUrl}/health`);
    const body: any = await health.json().catch(() => ({}));
    if (health.status === 200 && body.database === 'connected') report('PASS', 'GET /health', 'database connected');
    else report('FAIL', 'GET /health', `status ${health.status}`);
  } catch (err) {
    report('FAIL', 'GET /health', `not reachable (${err instanceof Error ? err.message : String(err)})`);
    return;
  }

  for (const route of ['/auth/me', '/goals', '/progress', '/admin/stats']) {
    const res = await fetch(`${apiUrl}${route}`).catch(() => null);
    if (res && res.status === 401) report('PASS', `GET ${route} without a token`, '401');
    else report('FAIL', `GET ${route} without a token`, `expected 401, got ${res ? res.status : 'no answer'}`);
  }

  const clientUrl = process.env.CLIENT_URL ?? '';
  if (clientUrl) {
    const allowed = await fetch(`${apiUrl}/health`, { headers: { Origin: clientUrl } }).catch(() => null);
    const origin = allowed?.headers.get('access-control-allow-origin');
    const credentials = allowed?.headers.get('access-control-allow-credentials');
    if (origin === clientUrl && credentials === 'true') report('PASS', 'CORS allows CLIENT_URL with credentials');
    else report('FAIL', 'CORS allows CLIENT_URL with credentials', `allow-origin: ${origin ?? 'none'}`);

    const foreign = await fetch(`${apiUrl}/health`, { headers: { Origin: 'https://evil.example.com' } }).catch(() => null);
    const foreignOrigin = foreign?.headers.get('access-control-allow-origin');
    if (!foreignOrigin) report('PASS', 'CORS rejects a foreign origin');
    else report('FAIL', 'CORS rejects a foreign origin', `allow-origin: ${foreignOrigin}`);
  }
};

async function main(): Promise<void> {
  console.log('SkillGraph deployment check\n');
  checkEnvironment();
  await checkDatabase();
  await checkServer();

  const count = (level: Level): number => results.filter((result) => result.level === level).length;
  console.log(`\n${count('PASS')} passed, ${count('WARN')} warnings, ${count('FAIL')} failed`);
  if (count('FAIL') > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});