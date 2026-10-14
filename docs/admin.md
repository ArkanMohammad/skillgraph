# Admin content management

Admins (role `ADMIN`) can change what users are tested on and what every goal contains,
without touching the code or the database. Everything is in `backend/src/services/adminContentService.ts`
and exposed under `/api/admin` (see `backend/src/routes/adminContentRoutes.ts`).
The screens are the **Questions**, **Goal skills**, **Mentors** and **Users** tabs of the Admin page.
Every change is made in a window (modal) that opens on top of the page, so the table never moves while an admin types.

## What an admin can do

| Area | Actions |
| --- | --- |
| Skills | create a skill, edit its name, category and description |
| Questions | add a question (4 options, exactly one correct), edit it, hide or show it |
| Goal skills | add an existing skill to a goal, change its required mastery, importance and hours, choose what it needs first (prerequisites), remove it from the goal |
| Mentors | add a new mentor account, or give an existing user the role MENTOR, assign a mentor to one or more goals, remove a mentor from a goal |
| Users | search the users, look at the progress of one user (skills, mastery, recent tests), change a role, write an advice for the user, delete a user |

## Rules that protect the data

| Rule | Why |
| --- | --- |
| A question is hidden (`is_active = FALSE`), never deleted | Deleting it would delete the answers of users (the foreign key is `ON DELETE CASCADE`) |
| Removing a skill from a goal does not delete the skill | The progress of users is stored per skill, so it stays and is reused by other goals |
| A skill needs at least 10 active questions | An assessment asks 10 questions (`QUESTIONS_PER_ASSESSMENT`) |
| A skill can only be added to a goal when it has 10 active questions | Otherwise users could not be tested on it |
| A goal keeps at least one skill | An empty goal cannot give a recommendation |
| Editing a question updates its 4 option rows in place | The saved answers of users point to those rows |
| Required mastery is 0.5 to 1, importance is above 0 up to 1, hours are whole numbers | Same limits the seed data follows |
| Prerequisites are chosen among the skills of the same goal | A link to a skill that is not in the goal would mean nothing inside it |
| A change that creates a cycle is refused | A skill in a cycle could never become READY |

A new skill starts with one concept called `General` (weight 1), so its questions can be attached to it.
A new skill has no prerequisites, so it is READY as soon as it is in a goal. Set its prerequisites on the
Goal skills tab.

## Prerequisites

The prerequisite links are stored once (`skill_dependencies`) and shared by all goals. Editing the
prerequisites of a skill inside one goal therefore changes it for every other goal that contains both
skills, and the screen tells which goals those are. A prerequisite of the skill that is not part of the
edited goal is never touched.

Saving replaces the whole list in one transaction. The table is locked while it runs, so two admins
cannot create a cycle together. User progress is not changed: LOCKED and READY are calculated from the
graph on every request.

## Mentors

A mentor is a person from the field who helps the learners of a goal (see [mentors.md](mentors.md)).
An admin adds a mentor in the **Mentors** tab with **Add mentor**: name, email, a first password (a random one can be generated) and, if wanted, the goals. This creates a new account with the role MENTOR. The window shows the login details once, so the admin can pass them on, and the mentor can change the password in the profile page.
An existing user becomes a mentor when an admin changes the role to **MENTOR** in the Overview tab. Then the **Mentors** tab is used to choose
the goals that mentor looks after. A goal can have several mentors and a mentor can look after several goals.
Learners see the mentors of their goal on the Dashboard (names only, never the email).
When a user stops being a mentor, the projects that were still waiting for them are released and the learners can take them back.

| Rule | Why |
| --- | --- |
| Only a user with the role MENTOR can be assigned to a goal | A learner must never see a normal user as a mentor |
| "Add mentor" never changes an existing account: a used email gives 409 | A learner cannot be turned into a mentor by a typing mistake. Use the role change for that |
| The password is stored as a bcrypt hash and has 8 to 72 characters | 72 is the limit of bcrypt |
| A user who stops being a MENTOR loses every goal | The role and the goals always agree |
| Removing a mentor from a goal does not delete the account | The mentor can look after other goals |
| The role is stored in the login token, so a changed role works after the next login | Same behavior as for admins |

## Users and advice

The **Users** tab lists the users. **View** opens a window with the goal, the progress of the user in every
skill of the goal (the same status the skill graph shows), the recent tests and the advice history. The admin
can write an advice there. The user sees a message icon with a red counter in the top bar of every page. It opens
a window called **Advice from admin** with all the messages (unread first). The user can mark one message or all
of them as read, and the admin sees whether a message was read.

| Rule | Why |
| --- | --- |
| An admin cannot delete their own account | The system would lose the admin who is working |
| An admin account cannot be deleted. Change its role to USER first | The system can never lose its admins by accident |
| Deleting a user needs the email typed as a confirmation | It removes the goals, progress, tests and advice of the user and cannot be undone |
| An advice is 1 to 1000 characters | Same limit as the database check |
| A user can only mark their own advice as read | Other users' advice is never touched |

## Seed and admin changes

`npm run seed` is the **initial** content. When the database already has goal skills it stops by itself
and prints a message, so it never overwrites the work of the admins.
To reset everything to the catalog on purpose (this overwrites their changes):

```bash
npm run seed -- --force
```

On the live site: `npm run seed:prod -- --force`.

`npm run check:seed` treats differences from the catalog as warnings (an admin changed something).
It still fails when a skill has fewer than 10 active questions.

## API

All routes need the ADMIN role (401 without login, 403 for a normal user).

| Method | Path | Body | Answer |
| --- | --- | --- | --- |
| GET | `/admin/skills` | | `{ skills }` with question counts and concepts |
| POST | `/admin/skills` | `name`, `category`, `description?` | 201 `{ id }` |
| PUT | `/admin/skills/:skillId` | `name`, `category`, `description?` | 204 |
| GET | `/admin/skills/:skillId/questions` | | `{ questions }` with options and the right answer |
| POST | `/admin/skills/:skillId/questions` | `conceptId`, `difficulty` (1-3), `prompt`, `options` (4 x `{ text, isCorrect }`) | 201 `{ id }` |
| PUT | `/admin/questions/:questionId` | same as above | 204 |
| PATCH | `/admin/questions/:questionId/active` | `isActive` (boolean) | 204 |
| GET | `/admin/goals/:goalId/skills` | | `{ goal, skills, available }` |
| POST | `/admin/goals/:goalId/skills` | `skillId`, `requiredMastery`, `importance`, `estimatedHours` | 201 |
| PUT | `/admin/goals/:goalId/skills/:skillId` | `requiredMastery`, `importance`, `estimatedHours` | 204 |
| DELETE | `/admin/goals/:goalId/skills/:skillId` | | 200 `{ affectedSkills }` |
| PUT | `/admin/goals/:goalId/skills/:skillId/prerequisites` | `prerequisiteIds` (list of skill ids of that goal) | 200 `{ added, removed, alsoAffectedGoals }` |
| GET | `/admin/mentors` | | `{ mentors }`, each with `id`, `name`, `email` and `goals` |
| POST | `/admin/mentors` | `name`, `email`, `password` (8-72 characters), `goalIds?` (list of goal ids) | 201 `{ mentor }` with the role MENTOR. 400 for a bad form, 404 for an unknown goal, 409 if the email is already registered |
| PUT | `/admin/goals/:goalId/mentors/:mentorId` | | 201 `{ created: true }`, or 200 `{ created: false }` when the link already existed. 400 if the user is not a MENTOR |
| DELETE | `/admin/goals/:goalId/mentors/:mentorId` | | 204. 404 if the mentor is not assigned to that goal |
| GET | `/admin/users/:userId` | | Profile, progress summary, skills with status and mastery, recent tests, advice |
| DELETE | `/admin/users/:userId` | | 200 `{ message }`. 400 for yourself, 409 for an admin |
| POST | `/admin/users/:userId/advice` | `message` (1-1000 characters) | 201 the advice |

The users list (`GET /admin/users`) and the role change (`PUT /admin/users/:userId/role`, with `USER`, `MENTOR` or `ADMIN`) already existed.

A learner reads the mentors of their goal with `GET /mentors/mine` (`{ goal, mentors }`, names only, 400 without a goal).

Users read their own advice with `GET /advice` (`{ advice, unread }`), `PATCH /advice/:adviceId/read` and `PATCH /advice/read-all` (`{ marked }`).

Errors use `{ message }` with 400 (invalid input or a rule above), 404 (not found) or 409 (duplicate).

## Tests

```bash
npm run test:db     # includes adminContent.test.ts (39), adminUsers.test.ts (19), mentors.test.ts (17), mentorAccounts.test.ts (10), projectShares.test.ts (27) and verifyRecommendation.test.ts (8)
```