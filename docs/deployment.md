# Deployment guide

SkillGraph has three parts: a static frontend, an Express backend and a PostgreSQL database.

```
Browser  ->  frontend host (static files + forwards /api)  ->  backend (Express)  ->  PostgreSQL
```

The frontend host forwards every `/api/...` request to the backend. The browser therefore talks to
**one address only**, so the login cookie (httpOnly, `SameSite=Lax`) works without any cross-site cookie settings.

## 1. Before you start

| Need | Version |
| --- | --- |
| Node.js | 20 or newer |
| PostgreSQL | 14 or newer, an empty database |
| Backend host | any host that runs a Node.js process (Render, Railway, a VPS, ...) |
| Frontend host | any static host that can forward `/api` (Vercel config is included, Netlify is shown below) |

## 2. Backend (Fihmia)

### Environment variables

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string of the production database |
| `JWT_SECRET` | random, at least 32 characters (`node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`) |
| `CLIENT_URL` | the exact frontend address, `https://...`, **no trailing slash** |
| `NODE_ENV` | `production` (login cookie becomes HTTPS-only, CORS allows only `CLIENT_URL`) |
| `PORT` | usually set by the host, default 3000 |

### Steps

```bash
cd backend
npm ci                    # install everything (the build needs the dev dependencies)
npm run build             # compiles TypeScript into dist/
npm run migrate:prod      # creates the tables on a new database and applies migrations/*.sql
npm run seed:prod         # goals, skills, prerequisites and the question bank (safe to repeat)
npm run check:deploy:prod # environment, database, migrations and seed checks
npm start                 # node dist/server.js
```

The server also applies pending migrations on start, so a new release only needs `npm run build` and a restart.

Create the first admin once (then log in again, the role is stored inside the login token):

```sql
UPDATE users SET role = 'ADMIN' WHERE email = 'you@example.com';
```

### Check the running backend

```bash
API_URL=https://YOUR-BACKEND-HOST/api npm run check:deploy:prod
```

It verifies `/health`, that protected routes answer `401` without a login, and the CORS rules
(`CLIENT_URL` is allowed with credentials, other origins are not).

## 3. Frontend (Arkan)

1. In `frontend/vercel.json` replace `YOUR-BACKEND-HOST` with the real backend address (once).
2. Create the project on the host with the **root directory `frontend`**.
   - Build command: `npm run build`
   - Output directory: `dist`
   - `frontend/.env.production` already sets `VITE_API_URL=/api`.
3. Deploy, then put the frontend address into the backend variable `CLIENT_URL` and restart the backend.

`vercel.json` does two things: it forwards `/api/*` to the backend, and it sends every other address to
`index.html`, so refreshing a page such as `/user/dashboard` does not give a 404.

### Netlify instead of Vercel

Create `frontend/public/_redirects` with these two lines (the API rule must come first):

```
/api/*  https://YOUR-BACKEND-HOST/api/:splat  200
/*      /index.html                           200
```

Build command `npm run build`, publish directory `frontend/dist`.

## 4. Smoke test after every deployment (5 minutes)

1. `https://YOUR-BACKEND-HOST/api/health` answers `{"status":"ok", ... "database":"connected"}`.
2. Open the frontend, register a new account and refresh the page: you stay logged in.
3. Select a goal: the dashboard shows 0% and a Next Best Skill with an explanation.
4. Take a short test: the result page appears and the dashboard recommendation changes.
5. Open `/user/skill-graph`, click a skill: the details panel opens.
6. Log in as the admin: the Admin item shows in the menu, a normal user does not see it.

## 5. Troubleshooting

| Symptom | Cause and fix |
| --- | --- |
| Login works but the next request is `401` | `NODE_ENV=production` over plain `http`: the Secure cookie is dropped. Use `https`. |
| Browser shows a CORS error | `CLIENT_URL` differs from the browser address (check `https`, the port and a trailing slash). |
| Refreshing a page gives 404 | The static host has no fallback to `index.html` (see `vercel.json` or `_redirects`). |
| `/api/...` returns HTML | The frontend host does not forward `/api`: check `YOUR-BACKEND-HOST` in `vercel.json`. |
| `relation "users" does not exist` | The migrations did not run on this database: `npm run migrate:prod`. |
| Goals show but a test says "No questions" | The seed was not run: `npm run seed:prod`. |
| Role change has no effect | The role is inside the token: log out and log in again. |
| `check:deploy` fails on `JWT_SECRET` | It is still the example value or empty. |