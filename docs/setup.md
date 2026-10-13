# Setup guide (local machine)

Follow these steps on a new computer. Everything runs locally; nothing else is needed.

## 1. Install

- Node.js 20 or newer
- PostgreSQL 14 or newer (with `psql`)
- Git

## 2. Get the code

```bash
git clone https://github.com/ArkanMohammad/skillgraph.git
cd skillgraph
```

## 3. Database

Create an empty database named `skillgraph`:

```bash
psql -U postgres -c "CREATE DATABASE skillgraph"
```

## 4. Backend

```bash
cd backend
npm install
cp .env.example .env
```

Edit `backend/.env`:

- `DATABASE_URL` with your PostgreSQL user and password
- `JWT_SECRET` any long random text
- `CLIENT_URL` the address you open the site on (`http://skillgraph` or `http://localhost:5173`)

Then:

```bash
npm run migrate      # creates the tables and applies the numbered migrations
  npm run seed         # 7 goals, 44 skills, prerequisites and 440 questions (10 per skill)
  npm run check:seed   # optional: checks that the data is consistent
npm run dev          # http://localhost:3000, check http://localhost:3000/api/health
```

## 5. Frontend

```bash
cd frontend
npm install
npm run dev
```

The dev server runs on port 80 and opens at `http://skillgraph`. To use that address, add this line to the hosts file
(Windows: `C:\Windows\System32\drivers\etc\hosts`, open the editor as administrator; macOS and Linux: `/etc/hosts`):

```
127.0.0.1 skillgraph
```

If port 80 is busy or you do not want the hosts entry, change `port` in `frontend/vite.config.ts` to `5173`,
remove `allowedHosts` and set `CLIENT_URL=http://localhost:5173` in `backend/.env`.

## 6. Demo accounts (optional)

```bash
cd backend
npm run seed:demo
```

Creates five accounts that start in different situations (password `Demo1234!`). See [demo.md](demo.md).

## 7. First admin

Every new account is a `USER`. Promote one account in `psql` (log in again afterwards):

```bash
psql -U postgres -d skillgraph -c "UPDATE users SET role = 'ADMIN' WHERE email = 'you@example.com'"
```

(`demo.admin@skillgraph.dev` is already an admin after `npm run seed:demo`.)

## 8. Run the tests

From the `backend` folder:

```bash
npm run test:unit    # no database needed
npm run test:db      # needs the migrated and seeded database
npm run test:api     # needs the backend running (npm run dev in another terminal)
```

## Common problems

| Message | Fix |
| --- | --- |
| `relation "users" does not exist` | You are connected to the wrong database (use `skillgraph`, not `postgres`) or the migration did not run. |
| `EADDRINUSE` on port 80 | Another program uses port 80. Stop it or change the port as described in step 5. |
| An error saying a variable is missing from `.env` | `backend/.env` does not exist or a value is empty. |
| Login works, refresh logs you out | `CLIENT_URL` does not match the address in the browser. |
| `npm run migrate` fails with invalid JSON | `package.json` has a missing comma. |