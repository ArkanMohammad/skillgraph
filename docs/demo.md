# Demo guide

Prepare once (from the `backend` folder, with the backend and the frontend running):

```bash
npm run seed:demo
```

Every run resets the demo accounts, so you can repeat the demo. The password of all accounts is `Demo1234!`.
The numbers below come from the real algorithm on the seeded data.

| Account | Goal | Situation |
| --- | --- | --- |
| `demo.beginner@skillgraph.dev` | Full Stack Developer | nothing mastered |
| `demo.midway@skillgraph.dev` | Frontend Developer | HTML and CSS mastered, Responsive Design half done |
| `demo.switcher@skillgraph.dev` | Frontend Developer | HTML, CSS, JavaScript and Git mastered |
| `demo.finisher@skillgraph.dev` | Frontend Developer | every Frontend skill mastered |
| `demo.admin@skillgraph.dev` | Full Stack Developer | role ADMIN |

## Scenario 1: a beginner gets a clear first step (1 min)

Log in as the beginner. Dashboard: goal progress 0%. **Next best skill: HTML**, score 89.3, "opens the way to 7 more skills",
21.3 points ahead of Git. "Also ready for you": Git and SQL.

Say: the recommendation is not a fixed list. It is calculated from the user's data, and the explanation says why.

## Scenario 2: the plan changes after a test (2 min)

Still as the beginner: Assessments, Start test on HTML, answer the questions (pick the correct answers) and open the result page.
Go back to the Dashboard: with a good score HTML is mastered, so it is no longer recommended, the progress moved and a new Next Best Skill appears. With a weak score HTML stays recommended and the mastery shows as partial.

Say: the assessment updates mastery and confidence, and the recommendation is recalculated from the latest data.

## Scenario 3: prerequisites and the graph (1 min)

Log in as the midway user. Dashboard: **Next best skill: JavaScript**, score 90, "opens the way to 3 more skills", 22.6 points
ahead of Web Accessibility. "Needs attention": Responsive Design 45%.

Open Skill Graph. Click a locked skill (for example React): the panel shows **Master these first: JavaScript**.
Click "Why this skill?" at the top: the panel explains the recommended skill with its reasons and study hours.

Say: a skill is mastered only with enough mastery and enough confidence, and locked skills wait for their prerequisites.

## Scenario 4: changing the goal keeps the progress (2 min)

Log in as the switcher (Frontend, 45%). Open Change goal. The cards show how much each goal is already covered:
**Full Stack 37%, Backend 19%, DevOps 10%** (Git, JavaScript and the rest are shared skills).
Select Backend Developer: the dashboard does not start from zero and the next skill is chosen for the new goal.

Say: progress is stored per user and skill, not per goal, so nothing is copied or lost when the goal changes.

## Scenario 5: a finished goal (1 min)

Log in as the finisher. Dashboard: the goal is shown as complete (100%) with a congratulation message instead of a next skill.
Change the goal to Full Stack Developer: it is already **58%** covered and a new Next Best Skill appears.

## Scenario 6: roles and protected routes (1 min)

Log in as the admin: the Admin item appears (totals, users per goal, change a role; an admin cannot change their own role).
Log in as any other demo user: there is no Admin item, and `/user/admin` sends the user back to the dashboard.
The API answers `401` without a login and `403` for a normal user.

## Scenario 7: errors are handled (30 s)

Stop the backend and open the Dashboard: a clear error box with a **Try again** button. Start the backend and press it: the page loads.

## Questions the evaluators may ask

- **Why not only "most important skill first"?** The utility score combines goal impact, readiness, unlock potential, gap priority and time
  efficiency (weights 0.30, 0.25, 0.20, 0.15, 0.10), and a skill whose prerequisites are not mastered is never recommended.
- **How do you decide a skill is mastered?** Mastery at least the goal's required level and confidence at least 0.70.
- **Does it work for any career?** Yes, one generic algorithm. A goal is only data: skills, requirements and prerequisites in PostgreSQL.
- **What happens when the goal changes?** The same `user_skills` rows are used again; only the set of skills and requirements changes.
- **How is it tested?** Unit tests for the algorithm, PostgreSQL tests for constraints and joins, API tests for auth, roles and ownership
  (`npm test`, `npm run test:api`), plus `npm run check:seed` and `npm run check:deploy`.