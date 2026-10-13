/**
 * Smoke test for a running SkillGraph site (local or deployed).
 * Usage: npm run smoke -- https://your-frontend-domain
 * Run it against the FRONTEND address so the same-origin proxy is tested too.
 * Needs the demo accounts (npm run seed:demo) and Node 18 or newer (fetch).
 */

const DEMO_PASSWORD = 'Demo1234!';
const base = (process.argv[2] || process.env.SMOKE_URL || 'http://localhost:3000').replace(/\/+$/, '');

let passed = 0;
let failed = 0;

function report(ok: boolean, name: string, detail = ''): void {
  if (ok) {
    passed += 1;
    console.log(`  PASS  ${name}`);
  } else {
    failed += 1;
    console.log(`  FAIL  ${name}${detail ? ` -> ${detail}` : ''}`);
  }
}

interface Reply {
  status: number;
  body: any;
  setCookie: string[];
}

async function call(method: string, path: string, cookie = '', body?: unknown): Promise<Reply> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (cookie) headers.Cookie = cookie;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${base}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  let parsed: any = null;
  try {
    parsed = await res.json();
  } catch {
    parsed = null; // Not JSON (for example an HTML error page)
  }

  const setCookie = typeof (res.headers as any).getSetCookie === 'function' ? (res.headers as any).getSetCookie() : [];
  return { status: res.status, body: parsed, setCookie };
}

/** Log in and return the "name=value" part of the auth cookie, plus the raw Set-Cookie line */
async function login(email: string, password: string): Promise<{ reply: Reply; cookie: string; raw: string }> {
  const reply = await call('POST', '/api/auth/login', '', { email, password });
  const raw = reply.setCookie[0] || '';
  return { reply, cookie: raw.split(';')[0] || '', raw };
}

async function main(): Promise<void> {
  console.log(`Smoke test against ${base}\n`);

  // 1. Server and database
  const health = await call('GET', '/api/health');
  report(health.status === 200 && health.body?.database === 'connected', 'GET /api/health is ok and database connected', `status ${health.status}`);

  // 2. Protected routes must refuse anonymous visitors
  const anon = await call('GET', '/api/goals');
  report(anon.status === 401, 'GET /api/goals without login gives 401', `status ${anon.status}`);

  // 3. Wrong password
  const bad = await login('demo.midway@skillgraph.dev', 'wrong-password');
  report(bad.reply.status === 401, 'wrong password gives 401', `status ${bad.reply.status}`);

  // 4. Real login and cookie flags
  const user = await login('demo.midway@skillgraph.dev', DEMO_PASSWORD);
  report(user.reply.status === 200, 'demo.midway can log in', `status ${user.reply.status}`);
  report(/httponly/i.test(user.raw), 'auth cookie is HttpOnly');
  if (base.startsWith('https://')) {
    report(/secure/i.test(user.raw), 'auth cookie is Secure on https');
  }

  // 5. The cookie works on later requests (this is what keeps the login after a refresh)
  const me = await call('GET', '/api/auth/me', user.cookie);
  report(me.status === 200, 'GET /api/auth/me works with the cookie', `status ${me.status}`);
  const noCookie = await call('GET', '/api/auth/me');
  report(noCookie.status === 401, 'GET /api/auth/me without cookie gives 401', `status ${noCookie.status}`);

  // 6. Core features
  const goals = await call('GET', '/api/goals', user.cookie);
  report(goals.status === 200, 'GET /api/goals with login', `status ${goals.status}`);

  const current = await call('GET', '/api/goals/current', user.cookie);
  report(current.status === 200, 'GET /api/goals/current', `status ${current.status}`);

  const next = await call('GET', '/api/recommendations/next', user.cookie);
  report(next.status === 200, 'GET /api/recommendations/next', `status ${next.status}`);
  report(Array.isArray(next.body?.candidates), 'recommendation contains ranked candidates');

  const progress = await call('GET', '/api/progress', user.cookie);
  report(progress.status === 200, 'GET /api/progress', `status ${progress.status}`);

  // 7. Roles
  const asUser = await call('GET', '/api/admin/stats', user.cookie);
  report(asUser.status === 403, 'normal user is blocked from /api/admin/stats', `status ${asUser.status}`);

  const admin = await login('demo.admin@skillgraph.dev', DEMO_PASSWORD);
  const asAdmin = await call('GET', '/api/admin/stats', admin.cookie);
  report(asAdmin.status === 200, 'admin can read /api/admin/stats', `status ${asAdmin.status}`);

  // 8. Logout
  const out = await call('POST', '/api/auth/logout', user.cookie);
  report(out.status === 200, 'POST /api/auth/logout', `status ${out.status}`);

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('Smoke test could not run:', err instanceof Error ? err.message : err);
  console.error('Is the site address correct and the server running?');
  process.exit(1);
});