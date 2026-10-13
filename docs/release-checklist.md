# Release checklist

Use this list before the final presentation and before tagging `v1.0.0`.

## 1. Code

- [ ] All pull requests are merged into `main` in this order: Day 12, Day 13, docs, Day 14
- [ ] `git log --oneline -10` on `main` shows all of them
- [ ] No `.env` file and no `backend/scripts/` folder is committed

## 2. Checks on the merged `main`

```bash
cd backend
npm run test
npm run check:deploy
npm run check:seed

cd ../frontend
npm run build
```

- [ ] Every command finishes with 0 failed

## 3. Deployment (done by the person who owns the hosting)

- [ ] Backend variables are set: `DATABASE_URL`, `JWT_SECRET`, `CLIENT_URL`, `NODE_ENV=production`
- [ ] `CLIENT_URL` is the frontend origin with no trailing slash
- [ ] `npm run migrate:prod` finished
- [ ] `npm run seed:prod` finished
- [ ] `npm run check:deploy:prod` shows 0 failed
- [ ] `YOUR-BACKEND-HOST` in `frontend/vercel.json` is replaced with the real backend address
- [ ] Frontend is deployed

## 4. Smoke test on the live site

```bash
cd backend
npm run seed:demo
npm run smoke -- https://YOUR-FRONTEND-DOMAIN
```

- [ ] 15 passed, 0 failed

## 5. Manual check in the browser

- [ ] Log in as `demo.midway@skillgraph.dev` (password `Demo1234!`)
- [ ] Refresh the page: you are still logged in
- [ ] Dashboard shows the Next Best Skill with an explanation
- [ ] Skill graph opens and a node shows its detail panel
- [ ] A full assessment (10 questions) finishes and the recommendation changes
- [ ] Progress page shows the new percent
- [ ] Changing the goal keeps the progress of shared skills
- [ ] Log in as `demo.admin@skillgraph.dev`: the admin page opens
- [ ] A normal user cannot open the admin page

## 6. Presentation

- [ ] `docs/presentation.md` read aloud twice, total time is about 10 minutes
- [ ] Demo rehearsed twice (3 minutes)
- [ ] Demo data reset right before the presentation with `npm run seed:demo`
- [ ] A short screen recording of the demo is saved as a backup in case the internet fails

## 7. Release

- [ ] Tag created by the person who has access to `main`:

```bash
git checkout main
git pull origin main
git tag -a v1.0.0 -m "SkillGraph v1.0.0"
git push origin v1.0.0
```