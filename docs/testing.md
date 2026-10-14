# Testing

All tests live in `backend/src/tests/`. There are 210 checks in total. They are plain TypeScript files that print `ok` or `FAIL` for every check and exit with an error code when something fails, so they also work in CI.

## Quick start

```bash
cd backend
npm run migrate
npm run seed
npm test           # unit + database tests
```

The API tests need a running server, so they are started separately (see below).

## Test groups

| Command | Needs | Checks | What it covers |
| --- | --- | --- | --- |
| `npm run test:unit` | Nothing | 66 | Pure logic, no database |
| `npm run test:db` | PostgreSQL after `migrate` and `seed` | 119 | Real database and real services |
| `npm run test:api` | Running backend (`npm run dev`) | 25 | HTTP level: auth, roles, validation, main flow |
| `npm test` | PostgreSQL | 185 | `test:unit` and `test:db` together |
| `npm run smoke` | Running site | 15 | A live check of a deployed or local site |

### Unit tests (66)

| File | Checks | Covers |
| --- | --- | --- |
| `recommendationEngine.test.ts` | 22 | Skill states (mastered, ready, locked), readiness, unlock value, candidate ranking, next best skill |
| `recommendationExplainer.test.ts` | 9 | The reasons shown for each recommendation |
| `progressSummary.test.ts` | 11 | The progress summary and request validators |
| `goalChange.test.ts` | 10 | Changing the goal: shared skills keep their mastery, the recommendation follows the new goal |
| `knowledgeDecay.test.ts` | 14 | The forgetting curve: half-life from confidence, retention over time, fresh / fading / due thresholds, review date |

### Database tests (119)

| File | Checks | Covers |
| --- | --- | --- |
| `recommendationDb.test.ts` | 13 | The real seeded database with the real services, using a temporary user |
| `postgresConstraints.test.ts` | 20 | Unique, foreign key and check constraints, cascade deletes, key joins |
| `adminContent.test.ts` | 39 | Admin content rules and PostgreSQL behavior: hidden questions are never asked, a skill needs at least 10 active questions, a goal keeps at least one skill, a failed change rolls back completely, user progress stays after a skill leaves a goal, prerequisite editing (no cycles, shared links, links outside the goal untouched) |
| `adminUsers.test.ts` | 19 | Advice input rules, saving and reading advice, unread counter, mark all as read, one user cannot touch another user's advice, the progress detail of a user, deleting a user removes all their data, an admin cannot delete themselves or another admin, advice stays when its author is deleted |
| `mentors.test.ts` | 17 | The role MENTOR, assigning mentors to goals (only mentors, no duplicates, several per goal), what a learner sees (names only), a user who stops being a mentor loses the goals, cascade deletes |
| `reviewDb.test.ts` | 11 | The review queue: only mastered skills of the current goal, order (most forgotten first), counters, next review date, stored mastery never changes, a new test restarts the curve |

These tests create their own fixture rows (names start with `d12test_`, `d15test_`, `d16test_` or `d17test_`) and delete them at the end, so the seeded content is not touched. If a run is killed in the middle, the leftover rows can be removed by running the test again.

### API tests (25)

`apiIntegration.test.ts` talks to a running server:

```bash
# terminal 1
cd backend
npm run dev

# terminal 2
cd backend
npm run test:api
```

It covers register and login, `401` without a cookie, `403` for a normal user on admin routes, input validation, ownership of data, and the main flow from choosing a goal to a recommendation. It creates users whose emails start with `apitest_` and removes them at the end. Set `API_URL` to test another server (default `http://localhost:3000/api`).

### Smoke test (15)

```bash
npm run smoke                       # local site
SITE_URL=https://your-site npm run smoke:prod
```

It checks a running site as a real visitor: health, login with a demo account, the HttpOnly cookie (and `Secure` on https), the goals, recommendation and progress endpoints, the admin area for a user and for an admin, and logout. Run it after every deploy. Use `npm run seed:demo` first so the demo accounts exist.

## Data checks

| Command | What it verifies |
| --- | --- |
| `npm run check:seed` | The seeded content: question bank per skill, prerequisite graph, goals |
| `npm run check:deploy` | The environment before a deploy: variables, database connection, migrations |

## Frontend

The frontend has no automated tests. It is checked with:

```bash
cd frontend
npm run build      # TypeScript check + production build
npm run lint
```

and by the manual steps in `docs/demo.md` and `docs/release-checklist.md`. The admin pages have a manual list in `docs/admin.md`.

## Before opening a pull request

1. `npm test` in `backend` passes with 0 failed.
2. `npm run check:seed` shows 0 failed.
3. `npm run build` passes in `backend` and in `frontend`.
4. If you changed an API route, run `npm run test:api` with the server running.

## Writing a new test

- Put the file in `backend/src/tests/` and name it `something.test.ts`.
- Follow the existing pattern: a `test(name, fn)` helper, a `passed` and `failed` counter, and `process.exit(1)` when `failed > 0`.
- A test that writes to the database must create its own rows with a unique prefix and delete them in a `finally` block.
- Add the file to the `test:unit` or `test:db` script in `backend/package.json`.