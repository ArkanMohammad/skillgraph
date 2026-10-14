# Mentors

A **mentor** is a person from the field who helps the learners of a goal. This feature is built in steps.

| Step | What | Status |
| --- | --- | --- |
| 1 | The role `MENTOR`, assigning mentors to goals, "Your mentor" card on the Dashboard | Done |
| 2 | A learner shares a project with the mentor of the goal and the mentor writes a signed recommendation | Planned |
| 3 | The recommendation as a PDF, and a public page that checks it | Planned |
| 4 | Code review and practical exercises written by the mentor | Planned |

## Step 1: roles and goals

- Migration `006_mentors` adds the role `MENTOR` and the table `goal_mentors` (see [database.md](database.md)).
- An admin changes the role of a user to `MENTOR` (Overview tab) and assigns the mentor to goals (Mentors tab).
- A goal can have several mentors and a mentor can look after several goals.
- A learner sees the mentors of their current goal on the Dashboard. Only the name is shown, never the email.
- A user who stops being a mentor loses every goal, so the role and the goals always agree.

Code: `backend/src/services/mentorService.ts`, `backend/src/routes/mentorRoutes.ts` (learner),
`backend/src/routes/adminMentorRoutes.ts` (admin), tests in `backend/src/tests/mentors.test.ts`.

## API

| Method | Path | Who | Answer |
| --- | --- | --- | --- |
| GET | `/mentors/mine` | Logged in | `{ goal, mentors: [{ id, name }] }`. 400 without a current goal |
| GET | `/admin/mentors` | Admin | `{ mentors: [{ id, name, email, goals }] }` |
| PUT | `/admin/goals/:goalId/mentors/:mentorId` | Admin | 201 `{ created: true }`, or 200 `{ created: false }`. 400 if the user is not a MENTOR, 404 for an unknown goal or user |
| DELETE | `/admin/goals/:goalId/mentors/:mentorId` | Admin | 204. 404 if the mentor is not assigned to that goal |
| PUT | `/admin/users/:userId/role` | Admin | The role can now be `USER`, `MENTOR` or `ADMIN` |

## Manual check

The quick way to see the result: run `npm run seed:demo` and log in as any demo learner. The account `demo.mentor@skillgraph.dev` looks after the Frontend and Full Stack goals, so "Your mentor" shows on their dashboard.

To try the admin steps yourself:

1. Log in as `demo.admin@skillgraph.dev`. In **Admin > Overview**, change a user to `MENTOR`.
2. Open **Admin > Mentors**. The mentor is listed with "No goal yet". Choose a goal and press **Assign**. A chip with the goal appears.
3. Log in as a learner who follows that goal. The Dashboard shows the card **Your mentor** with the name.
4. Back in the admin page, press the x on the chip. The learner no longer sees the card.
5. Change the mentor back to `USER`. The Mentors tab no longer lists them.

## Rules for the next steps

- The recommendation text is always written by the mentor. The system never writes it.
- It is a personal recommendation, not an official certificate, and the PDF says so.
- The role is stored in the login token. Mentor-only routes must also check the role in the database, so a user who was demoted loses access at once.