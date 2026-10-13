# SkillGraph

SkillGraph turns a career goal into a graph of skills and tells the learner what to study next.
The user picks a goal, takes short adaptive assessments, and the system recommends the
**Next Best Skill** with a clear explanation. After every assessment the plan is recalculated.

## Screenshots

![Dashboard](docs/screenshots/dashboard.png)
![Skill graph](docs/screenshots/skill-graph.png)
![Progress](docs/screenshots/progress.png)
![Assessment](docs/screenshots/assessment.png)

## Tech stack

| Part | Technology |
| --- | --- |
| Frontend | React, TypeScript, Vite, React Router, Redux Toolkit, React Flow (`@xyflow/react`) |
| Backend | Node.js, Express, TypeScript, JWT in an httpOnly cookie |
| Database | PostgreSQL |

## Project structure

```
backend/
  schema.sql            baseline database schema
  migrations/           numbered SQL changes applied after the baseline
  src/
    config/             env, database pool, migration runner
    middleware/         auth, role check, request validation
    routes/             auth, goals, graph, assessments, recommendations, progress, account, admin, health
    services/algorithm/ pure algorithm code (scoring, adaptive questions, recommendation, explanations)
    seed/               goals, skills, prerequisites and the question bank
    tests/              unit tests and database tests
frontend/
  src/
    pages/ components/ hooks/ services/ features/ (Redux slices) routes/ styles/
docs/
  algorithm.md          how the recommendation algorithm works
  setup.md              step by step setup on a new computer
  demo.md               demo accounts and the presentation scenarios
  deployment.md         backend and frontend deployment, smoke test, troubleshooting
```

## Run it locally

### 1. Database

Create an empty PostgreSQL database named `skillgraph`.

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env        # then edit DATABASE_URL and JWT_SECRET
npm run migrate             # applies schema.sql once, then every file in migrations/
npm run seed                # goals, skills, edges, questions
npm run dev                 # http://localhost:3000
```

The server also runs the pending migrations when it starts, so `npm run migrate`
is only needed when you want to run them by hand.

Check that it works: `GET http://localhost:3000/api/health` returns `{ "status": "ok" ... }`.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

The dev server forwards `/api` to the backend (`VITE_API_URL=/api`).
If you use the `http://skillgraph` dev domain, add `127.0.0.1 skillgraph` to the hosts file
and set `CLIENT_URL=http://skillgraph` in `backend/.env`.

More detail: [docs/setup.md](docs/setup.md). Demo accounts for a presentation: `npm run seed:demo`
(see [docs/demo.md](docs/demo.md)).

## Roles and the first admin

Every new account is a `USER`. Routes under `/admin` answer `401` without a login and `403`
for a `USER`. To make the first admin, run this once in `psql` (then log in again, because the
role is stored inside the login token):

```sql
UPDATE users SET role = 'ADMIN' WHERE email = 'you@example.com';
```

Admins can then promote or demote other users from the Admin page of the app.

## Tests

From the `backend` folder:

```bash
npm run test:unit     # algorithm, explanations, progress, goal change (no database needed)
npm run test:db       # recommendation flow + constraints, foreign keys, joins, cascades (needs the migrated database)
npm run test:api      # HTTP tests: auth, 401/403, validation, ownership, assessment flow (the server must be running)
npm test              # test:unit and test:db
```

What each group covers:

| Group | Covers |
|-------|--------|
| `test:unit` | mastered skills are excluded, unmet prerequisites block a skill, unlock comparisons, goal complete, goal change reuses mastery, the recommendation changes after mastery updates |
| `test:db` | UNIQUE, FOREIGN KEY, CHECK and enum constraints, ON DELETE CASCADE, the key joins (graph, per-user progress, progress of all goals) |
| `test:api` | register/login, invalid credentials, missing or invalid JWT (401), USER on admin routes (403), validation (400/404), another user's assessment (ownership), assessment completion updates `user_skills`, structured recommendation explanation, account deletion |

The database and API tests create their own users (`d12test_*`, `apitest_*`) and remove them at the end.

### Data and deployment checks

```bash
npm run check:seed      # reads the database: catalog match, prerequisite cycles, 6 questions per skill, one correct option per question
npm run check:deploy    # environment variables, database, migrations and seed
API_URL=https://your-api.example.com/api npm run check:deploy   # also checks a running server
```

Full deployment guide: [docs/deployment.md](docs/deployment.md).

`check:deploy` checks the environment variables (JWT secret, `CLIENT_URL`, `NODE_ENV`), the database connection, the applied migrations, the seed data, and, with `API_URL`, the health endpoint, CORS and the protection of the routes. It exits with an error when something fails.

## API overview

All routes are under `/api`. Everything except `auth` and `health` needs the login cookie.

| Method | Route | What it does |
| --- | --- | --- |
| POST | `/auth/register`, `/auth/login`, `/auth/logout` | Account and session |
| GET | `/auth/me` | Who is logged in |
| GET | `/goals` | List career goals |
| GET, PUT | `/goals/current`, `/goals/select` | Read and choose the current goal |
| GET | `/graph/:goalId` | Skill nodes and prerequisite edges with the user's state |
| POST | `/assessments/start` | Start (or resume) an assessment for a skill |
| POST | `/assessments/:id/answer` | Save one answer, get the next question |
| POST | `/assessments/:id/complete` | Score the assessment and replan |
| GET | `/recommendations/next` | Next Best Skill with its explanation |
| GET | `/progress` | Progress of the current goal (percent, hours left, categories, recent tests) |
| GET | `/progress/goals` | Progress in every goal (a new goal starts with the skills you already know) |
| GET, PUT | `/account/profile` | Name, email and weekly learning hours |
| PUT | `/account/password` | Change password |
| DELETE | `/account` | Delete the account |
| GET | `/health` | Server status |
| GET | `/admin/stats` | Admin only: totals and users per goal |
| GET | `/admin/users` | Admin only: users with their goal (`?limit=&offset=`) |
| PUT | `/admin/users/:userId/role` | Admin only: change a role (not your own) |

The algorithm is explained in [docs/algorithm.md](docs/algorithm.md).

## Team

- Arkan Mohamad Issa: algorithm, PostgreSQL, frontend, assessment
- Fihmia Bader: Express infrastructure, authentication and roles, route wiring, deployment