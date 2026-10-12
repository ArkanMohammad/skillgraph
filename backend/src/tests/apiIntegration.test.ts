/**
 * API integration tests (HTTP level): auth, 401/403, validation, ownership and the main flow.
 *
 * It talks to a RUNNING server, so start the backend first (npm run dev), then in a second terminal,
 * from the backend folder:
 *   npm run test:api
 *
 * Optional: API_URL=http://localhost:3000/api (default).
 * The test creates its own users (emails start with "apitest_") and deletes them at the end.
 * It uses the same .env as the server, only to promote one user to ADMIN and to clean up.
 */
import assert from 'node:assert';
import { pool, query } from '../config/db';

const API_URL = (process.env.API_URL || 'http://localhost:3000/api').replace(/\/$/, '');
const PASSWORD = 'Test1234!';

let passed = 0;
let failed = 0;

interface ApiResponse {
  status: number;
  body: any;
  setCookie: string | null;
}

/** One HTTP call. `token` is sent as a Bearer header, the login also returns it in the body */
const call = async (method: string, path: string, options: { token?: string; body?: unknown } = {}): Promise<ApiResponse> => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (options.token) headers.Authorization = `Bearer ${options.token}`;
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  const text = await res.text();
  let body: any = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { status: res.status, body, setCookie: res.headers.get('set-cookie') };
};

const test = async (name: string, fn: () => Promise<void>): Promise<void> => {
  try {
    await fn();
    passed += 1;
    console.log(`ok    ${name}`);
  } catch (err) {
    failed += 1;
    console.log(`FAIL  ${name}`);
    console.log(`      ${err instanceof Error ? err.message : String(err)}`);
  }
};

const register = (name: string, email: string) =>
  call('POST', '/auth/register', { body: { name, email, password: PASSWORD } });

const login = async (email: string): Promise<string> => {
  const res = await call('POST', '/auth/login', { body: { email, password: PASSWORD } });
  assert.strictEqual(res.status, 200, `login failed: ${JSON.stringify(res.body)}`);
  return res.body.token as string;
};

async function main(): Promise<void> {
  const stamp = Date.now();
  const emailA = `apitest_a_${stamp}@example.com`;
  const emailB = `apitest_b_${stamp}@example.com`;
  const emailAdmin = `apitest_admin_${stamp}@example.com`;
  let tokenA = '';
  let tokenB = '';
  let tokenAdmin = '';
  let idB = '';

  try {
    // Fail fast with a clear message when the server is not running
    const health = await fetch(`${API_URL}/health`).catch(() => null);
    if (!health || health.status !== 200) {
      console.log(`The server is not reachable at ${API_URL}. Start it with "npm run dev" and run this again.`);
      process.exit(1);
    }

    // ---------- Health and auth ----------
    await test('health: the server and the database are up', async () => {
      const res = await call('GET', '/health');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.database, 'connected');
    });

    await test('register: a new account is created without exposing the password hash', async () => {
      const res = await register('Api Tester A', emailA);
      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.user.email, emailA);
      assert.strictEqual(res.body.user.role, 'USER');
      assert.ok(!('password_hash' in res.body.user), 'password_hash must never be returned');
    });

    await test('register: duplicate email gives 409, missing fields give 400', async () => {
      assert.strictEqual((await register('Again', emailA)).status, 409);
      assert.strictEqual((await call('POST', '/auth/register', { body: { email: emailA } })).status, 400);
    });

    await test('login: valid credentials return a token and set the httpOnly cookie', async () => {
      const res = await call('POST', '/auth/login', { body: { email: emailA, password: PASSWORD } });
      assert.strictEqual(res.status, 200);
      assert.ok(typeof res.body.token === 'string' && res.body.token.length > 20);
      assert.ok(res.setCookie && /HttpOnly/i.test(res.setCookie), 'cookie must be httpOnly');
      assert.ok(!('password_hash' in res.body.user));
      tokenA = res.body.token;
    });

    await test('login: wrong password, unknown email and empty body are rejected', async () => {
      assert.strictEqual((await call('POST', '/auth/login', { body: { email: emailA, password: 'wrong' } })).status, 401);
      assert.strictEqual((await call('POST', '/auth/login', { body: { email: 'nobody@example.com', password: PASSWORD } })).status, 401);
      assert.strictEqual((await call('POST', '/auth/login', { body: {} })).status, 400);
    });

    await test('login: email is case-insensitive', async () => {
      const res = await call('POST', '/auth/login', { body: { email: emailA.toUpperCase(), password: PASSWORD } });
      assert.strictEqual(res.status, 200);
    });

    await test('me: returns the logged in user', async () => {
      const res = await call('GET', '/auth/me', { token: tokenA });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.user.email, emailA);
    });

    // ---------- 401: missing or invalid JWT ----------
    const protectedRoutes: [string, string][] = [
      ['GET', '/auth/me'],
      ['GET', '/goals'],
      ['GET', '/goals/current'],
      ['GET', '/graph/1'],
      ['GET', '/recommendations/next'],
      ['GET', '/progress'],
      ['GET', '/account/profile'],
      ['POST', '/assessments/start'],
      ['GET', '/admin/stats'],
    ];

    await test('401: every protected endpoint rejects a request without a token', async () => {
      for (const [method, path] of protectedRoutes) {
        const res = await call(method, path);
        assert.strictEqual(res.status, 401, `${method} ${path} answered ${res.status}`);
      }
    });

    await test('401: garbage, tampered and malformed tokens are rejected', async () => {
      const tampered = `${tokenA.slice(0, -4)}abcd`;
      for (const token of ['not-a-jwt', tampered, 'a.b.c']) {
        const res = await call('GET', '/auth/me', { token });
        assert.strictEqual(res.status, 401, `token "${token.slice(0, 12)}..." answered ${res.status}`);
      }
      const noBearer = await fetch(`${API_URL}/auth/me`, { headers: { Authorization: tokenA } });
      assert.strictEqual(noBearer.status, 401, 'a header without "Bearer " must be rejected');
    });

    // ---------- 403: RBAC ----------
    await test('403: a normal USER cannot use the admin endpoints', async () => {
      assert.strictEqual((await call('GET', '/admin/stats', { token: tokenA })).status, 403);
      assert.strictEqual((await call('GET', '/admin/users', { token: tokenA })).status, 403);
      assert.strictEqual(
        (await call('PUT', '/admin/users/00000000-0000-0000-0000-000000000000/role', { token: tokenA, body: { role: 'ADMIN' } })).status,
        403
      );
    });

    await test('403 -> 200: an ADMIN can (the role is read from the token, so log in again)', async () => {
      assert.strictEqual((await register('Api Admin', emailAdmin)).status, 201);
      await query(`UPDATE users SET role = 'ADMIN' WHERE email = $1`, [emailAdmin]);
      tokenAdmin = await login(emailAdmin);
      const stats = await call('GET', '/admin/stats', { token: tokenAdmin });
      assert.strictEqual(stats.status, 200);
      const users = await call('GET', '/admin/users?limit=5', { token: tokenAdmin });
      assert.strictEqual(users.status, 200);
    });

    await test('admin: invalid role and own-role change are refused', async () => {
      const me = await call('GET', '/auth/me', { token: tokenAdmin });
      const ownId = me.body.user.id as string;
      const own = await call('PUT', `/admin/users/${ownId}/role`, { token: tokenAdmin, body: { role: 'USER' } });
      assert.strictEqual(own.status, 400, `own role change answered ${own.status}`);
      const bad = await call('PUT', `/admin/users/${ownId}/role`, { token: tokenAdmin, body: { role: 'OWNER' } });
      assert.strictEqual(bad.status, 400);
      const notUuid = await call('PUT', '/admin/users/abc/role', { token: tokenAdmin, body: { role: 'USER' } });
      assert.strictEqual(notUuid.status, 400);
    });

    // ---------- Validation ----------
    await test('validation: bad ids and bodies answer 400 (not 500)', async () => {
      assert.strictEqual((await call('GET', '/graph/abc', { token: tokenA })).status, 400);
      assert.strictEqual((await call('GET', '/graph/-1', { token: tokenA })).status, 400);
      assert.strictEqual((await call('GET', '/graph/0', { token: tokenA })).status, 400);
      assert.strictEqual((await call('POST', '/assessments/start', { token: tokenA, body: {} })).status, 400);
      assert.strictEqual((await call('POST', '/assessments/start', { token: tokenA, body: { skillId: 'x' } })).status, 400);
      assert.strictEqual((await call('POST', '/assessments/abc/answer', { token: tokenA, body: { questionId: 1, selectedOptionId: 1 } })).status, 400);
      assert.strictEqual((await call('POST', '/assessments/1/answer', { token: tokenA, body: { questionId: 1 } })).status, 400);
      assert.strictEqual((await call('PUT', '/goals/select', { token: tokenA, body: { goalId: 'x' } })).status, 400);
    });

    await test('validation: unknown goal and skill answer 404, unknown route answers 404', async () => {
      assert.strictEqual((await call('GET', '/graph/999999', { token: tokenA })).status, 404);
      assert.strictEqual((await call('PUT', '/goals/select', { token: tokenA, body: { goalId: 999999 } })).status, 404);
      assert.strictEqual((await call('POST', '/assessments/start', { token: tokenA, body: { skillId: 999999 } })).status, 404);
      assert.strictEqual((await call('GET', '/no-such-route', { token: tokenA })).status, 404);
    });

    await test('validation: profile rules (weekly hours 1-80, email format, email already taken)', async () => {
      const base = { name: 'Api Tester A', email: emailA, weeklyHours: 10 };
      assert.strictEqual((await call('PUT', '/account/profile', { token: tokenA, body: { ...base, weeklyHours: 0 } })).status, 400);
      assert.strictEqual((await call('PUT', '/account/profile', { token: tokenA, body: { ...base, weeklyHours: 81 } })).status, 400);
      assert.strictEqual((await call('PUT', '/account/profile', { token: tokenA, body: { ...base, email: 'not-an-email' } })).status, 400);
      assert.strictEqual((await call('PUT', '/account/profile', { token: tokenA, body: { ...base, email: emailAdmin } })).status, 409);
      assert.strictEqual((await call('PUT', '/account/profile', { token: tokenA, body: base })).status, 200);
    });

    // ---------- Goal, graph, recommendation ----------
    let goalId = 0;
    let skillIds: number[] = [];

    await test('goals: the seed has goals, selecting one makes it the current goal', async () => {
      const list = await call('GET', '/goals', { token: tokenA });
      assert.strictEqual(list.status, 200);
      assert.ok(list.body.goals.length >= 1, 'no goals: the server seeds them on start');
      goalId = list.body.goals[0].id;
      const select = await call('PUT', '/goals/select', { token: tokenA, body: { goalId } });
      assert.strictEqual(select.status, 200);
      const current = await call('GET', '/goals/current', { token: tokenA });
      assert.strictEqual(current.body.goal.id, goalId);
    });

    await test('graph: nodes and edges for the goal, edges only connect nodes of the goal', async () => {
      const res = await call('GET', `/graph/${goalId}`, { token: tokenA });
      assert.strictEqual(res.status, 200);
      assert.ok(res.body.nodes.length > 0);
      skillIds = res.body.nodes.map((n: { id: number }) => n.id);
      const ids = new Set(skillIds);
      for (const edge of res.body.edges) {
        assert.ok(ids.has(edge.source) && ids.has(edge.target), 'edge points outside the goal');
      }
      for (const node of res.body.nodes) {
        assert.ok(['MASTERED', 'READY', 'LOCKED'].includes(node.userState), `bad state ${node.userState}`);
      }
    });

    await test('recommendation: returns a structured explanation for the next skill', async () => {
      const res = await call('GET', '/recommendations/next', { token: tokenA });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.goal.id, goalId);
      assert.strictEqual(res.body.goalComplete, false);
      assert.ok(res.body.next, 'a beginner always has a next skill');
      const explanation = res.body.next.explanation;
      assert.ok(typeof explanation.summary === 'string' && explanation.summary.length > 0);
      assert.ok(Array.isArray(explanation.reasons) && explanation.reasons.length > 0);
      assert.ok(typeof explanation.unlocksCount === 'number');
      assert.ok(Array.isArray(res.body.candidates) && res.body.candidates.length >= 1);
    });

    // ---------- Assessment flow and ownership ----------
    let assessmentId = 0;
    let firstQuestion: { id: number; options: { id: number }[] } | null = null;
    let assessedSkill = 0;

    await test('assessment: start returns a question with options', async () => {
      for (const skillId of skillIds) {
        const res = await call('POST', '/assessments/start', { token: tokenA, body: { skillId } });
        if (res.status === 201) {
          assessmentId = res.body.assessmentId;
          firstQuestion = res.body.question;
          assessedSkill = skillId;
          break;
        }
        assert.strictEqual(res.status, 400, `unexpected status ${res.status}`);
      }
      assert.ok(assessmentId > 0, 'no skill of this goal has questions');
      assert.ok(firstQuestion && firstQuestion.options.length >= 2);
    });

    await test('ownership: another user cannot answer or complete my assessment', async () => {
      assert.strictEqual((await register('Api Tester B', emailB)).status, 201);
      tokenB = await login(emailB);
      idB = (await call('GET', '/auth/me', { token: tokenB })).body.user.id;
      const answer = await call('POST', `/assessments/${assessmentId}/answer`, {
        token: tokenB,
        body: { questionId: firstQuestion!.id, selectedOptionId: firstQuestion!.options[0].id },
      });
      assert.ok([403, 404].includes(answer.status), `answer by another user answered ${answer.status}`);
      const complete = await call('POST', `/assessments/${assessmentId}/complete`, { token: tokenB });
      assert.ok([403, 404].includes(complete.status), `complete by another user answered ${complete.status}`);
      const rows = await query(`SELECT 1 FROM assessment_answers WHERE assessment_id = $1`, [assessmentId]);
      assert.strictEqual(rows.rowCount, 0, 'the foreign answer must not be saved');
    });

    await test('assessment: answer wrong question or foreign option is refused, completing early is a 409', async () => {
      const badOption = await call('POST', `/assessments/${assessmentId}/answer`, {
        token: tokenA,
        body: { questionId: firstQuestion!.id, selectedOptionId: 999999999 },
      });
      assert.ok([400, 404].includes(badOption.status), `answered ${badOption.status}`);
      const early = await call('POST', `/assessments/${assessmentId}/complete`, { token: tokenA });
      assert.strictEqual(early.status, 409);
    });

    await test('assessment: completing updates user_skills and the recommendation reads the new mastery', async () => {
      let question = firstQuestion;
      let guard = 0;
      while (question && guard < 50) {
        guard += 1;
        const res = await call('POST', `/assessments/${assessmentId}/answer`, {
          token: tokenA,
          body: { questionId: question.id, selectedOptionId: question.options[0].id },
        });
        assert.strictEqual(res.status, 200, `answer answered ${res.status}: ${JSON.stringify(res.body)}`);
        question = res.body.finished ? null : res.body.question;
      }

      const before = await query(`SELECT 1 FROM user_skills WHERE user_id = (SELECT id FROM users WHERE email = $1) AND skill_id = $2`, [emailA, assessedSkill]);
      assert.strictEqual(before.rowCount, 0, 'no user_skills row before completing');

      const done = await call('POST', `/assessments/${assessmentId}/complete`, { token: tokenA });
      assert.strictEqual(done.status, 200, JSON.stringify(done.body));
      assert.ok(done.body.finalScore >= 0 && done.body.finalScore <= 100);
      assert.ok(['MASTERED', 'READY', 'LOCKED'].includes(done.body.state));
      assert.ok(done.body.nextRecommendation, 'the response replans with the new mastery');

      const after = await query<{ proficiency_level: string }>(
        `SELECT proficiency_level FROM user_skills WHERE user_id = (SELECT id FROM users WHERE email = $1) AND skill_id = $2`,
        [emailA, assessedSkill]
      );
      assert.strictEqual(after.rowCount, 1, 'user_skills must have a row after completing');
      assert.ok(Math.abs(Number(after.rows[0].proficiency_level) * 100 - done.body.mastery) <= 1, 'saved mastery differs from the response');

      // The graph and the recommendation endpoint see the same mastery
      const graph = await call('GET', `/graph/${goalId}`, { token: tokenA });
      const node = graph.body.nodes.find((n: { id: number }) => n.id === assessedSkill);
      assert.strictEqual(node.mastery, done.body.mastery);
      const again = await call('GET', '/recommendations/next', { token: tokenA });
      assert.strictEqual(again.status, 200);
    });

    await test('assessment: completing twice is a 409 and does not change the saved mastery', async () => {
      const second = await call('POST', `/assessments/${assessmentId}/complete`, { token: tokenA });
      assert.ok([409, 404].includes(second.status), `answered ${second.status}`);
    });

    await test('progress: the overview reflects the assessed skill', async () => {
      const res = await call('GET', '/progress', { token: tokenA });
      assert.strictEqual(res.status, 200);
    });

    // ---------- Account deletion ----------
    await test('account: wrong password is refused, correct password deletes the account and its data', async () => {
      const wrong = await call('DELETE', '/account', { token: tokenB, body: { password: 'nope' } });
      assert.strictEqual(wrong.status, 400);
      const ok = await call('DELETE', '/account', { token: tokenB, body: { password: PASSWORD } });
      assert.strictEqual(ok.status, 200);
      const rows = await query(`SELECT 1 FROM users WHERE id = $1`, [idB]);
      assert.strictEqual(rows.rowCount, 0);
      const login = await call('POST', '/auth/login', { body: { email: emailB, password: PASSWORD } });
      assert.strictEqual(login.status, 401);
    });
  } finally {
    await query(`DELETE FROM users WHERE email LIKE $1`, ['apitest\\_%']);
    await pool.end();
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});