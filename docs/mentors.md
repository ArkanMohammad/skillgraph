# Mentors

A **mentor** is a person from the field who helps the learners of a goal. This feature is built in steps.

| Step | What | Status |
| --- | --- | --- |
| 1 | The role `MENTOR`, assigning mentors to goals, "Your mentor" card on the Dashboard | Done |
| 2 | A learner shares a project with a mentor of the goal and the mentor writes a signed recommendation | Done |
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

## Step 2: projects and signed recommendations

- Migration `007_project_shares` adds `project_shares` and `recommendations` (see [database.md](database.md)).
- A learner opens **Projects**, picks a mentor of their current goal, and shares a project: title, description and an optional link. A learner can have at most 5 projects waiting.
- The mentor opens **Mentor Desk** (only visible for the role MENTOR). For every waiting project the mentor can:
  - **Write a recommendation**: their own title, their own words (50 to 2000 characters) and a signature drawn on the signature pad (mouse, finger or pen). The signature is stored as a transparent PNG.
  - **Decline**, with an optional note (up to 300 characters) that the learner reads.
- A project is answered once. A recommendation gets a unique code such as `SG-7KQ2-M9XD-4TPA`.
- The learner reads the recommendation in the **View recommendation** window. It is laid out like the paper it will become in step 3: the SkillGraph name on top, the mentor's words, the fixed seal "Issued via SkillGraph" with the code at the bottom left, and the mentor's signature, name, title and date at the bottom right.
- A learner can take back a project that is waiting or declined. A project with a recommendation stays.
- If the mentor account is deleted, the signed recommendation stays with the name it was signed with. If the user stops being a mentor, the waiting projects are released.

Code: `backend/src/services/projectShareService.ts`, `backend/src/routes/projectRoutes.ts` (learner),
`backend/src/routes/mentorDeskRoutes.ts` (mentor), tests in `backend/src/tests/projectShares.test.ts`.
Frontend: `ProjectsPage`, `MentorDeskPage`, `SignaturePad`, `RecommendationView`.

## API

| Method | Path | Who | Answer |
| --- | --- | --- | --- |
| GET | `/mentors/mine` | Logged in | `{ goal, mentors: [{ id, name }] }`. 400 without a current goal |
| GET | `/admin/mentors` | Admin | `{ mentors: [{ id, name, email, goals }] }` |
| PUT | `/admin/goals/:goalId/mentors/:mentorId` | Admin | 201 `{ created: true }`, or 200 `{ created: false }`. 400 if the user is not a MENTOR, 404 for an unknown goal or user |
| DELETE | `/admin/goals/:goalId/mentors/:mentorId` | Admin | 204. 404 if the mentor is not assigned to that goal |
| PUT | `/admin/users/:userId/role` | Admin | The role can now be `USER`, `MENTOR` or `ADMIN` |
| POST | `/projects` | Logged in | Body `{ mentorId, title, description, projectUrl? }`. 201 `{ id }`. 400 for a bad form, a mentor who does not look after your goal, no goal, or 5 projects already waiting |
| GET | `/projects/mine` | Logged in | `{ projects }`, newest first, each with its `recommendation` (or `null`) |
| DELETE | `/projects/:shareId` | Logged in | 204. 400 if the project has a recommendation, 404 if it is not yours |
| GET | `/mentor/requests` | MENTOR | `{ requests }`, waiting ones first. 403 for everyone else |
| POST | `/mentor/requests/:shareId/recommendation` | MENTOR | Body `{ body, mentorTitle, signature }`. 201 `{ code }`. 400 for a bad form or signature, 404 if the project was not shared with you, 409 if it was already answered |
| POST | `/mentor/requests/:shareId/decline` | MENTOR | Body `{ note? }`. 200. 404 and 409 like above |

## Manual check

The quick way to see the result: run `npm run seed:demo` and log in as any demo learner. The account `demo.mentor@skillgraph.dev` looks after the Frontend and Full Stack goals, so "Your mentor" shows on their dashboard.

To try the admin steps yourself:

1. Log in as `demo.admin@skillgraph.dev`. In **Admin > Overview**, change a user to `MENTOR`.
2. Open **Admin > Mentors**. The mentor is listed with "No goal yet". Choose a goal and press **Assign**. A chip with the goal appears.
3. Log in as a learner who follows that goal. The Dashboard shows the card **Your mentor** with the name.
4. Back in the admin page, press the x on the chip. The learner no longer sees the card.
5. Change the mentor back to `USER`. The Mentors tab no longer lists them.

## Manual check of step 2

1. Log in as a demo learner who follows Frontend Developer. Open **Projects**, choose the mentor, fill the form and press **Send to the mentor**. The project shows "Waiting for the mentor".
2. Log in as `demo.mentor@skillgraph.dev`. Open **Mentor Desk**. The project is under "Waiting for you".
3. Press **Write a recommendation**. Fill your title and text, draw a signature, then press **Sign and send**. A message shows the code.
4. Log in as the learner again. The project says "Recommended". Press **View recommendation** to see the text, the seal with the code and the signature.
5. Send another project and press **Decline** with a note as the mentor. The learner sees the note and can remove the project.

## Rules for the next steps

- The recommendation text is always written by the mentor. The system never writes it.
- It is a personal recommendation, not an official certificate, and the PDF says so.
- The role is stored in the login token. Mentor-only routes must also check the role in the database, so a user who was demoted loses access at once.