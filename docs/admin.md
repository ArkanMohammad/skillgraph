# Admin content management

Admins (role `ADMIN`) can change what users are tested on and what every goal contains,
without touching the code or the database. Everything is in `backend/src/services/adminContentService.ts`
and exposed under `/api/admin` (see `backend/src/routes/adminContentRoutes.ts`).
The screens are the **Questions**, **Goal skills** and **Users** tabs of the Admin page.
Every change is made in a window (modal) that opens on top of the page, so the table never moves while an admin types.

## What an admin can do

| Area | Actions |
| --- | --- |
| Skills | create a skill, edit its name, category and description |
| Questions | add a question (4 options, exactly one correct), edit it, hide or show it |
| Goal skills | add an existing skill to a goal, change its required mastery, importance and hours, choose what it needs first (prerequisites), remove it from the goal |
| Users | search the users, look at the progress of one user (skills, mastery, recent tests), change a role, write an advice for the user, delete a user |

## Rules that protect the data

| Rule | Why |
| --- | --- |
| A question is hidden (`is_active = FALSE`), never deleted | Deleting it would delete the answers of users (the foreign key is `ON DELETE CASCADE`) |
| Removing a skill from a goal does not delete the skill | The progress of users is stored per skill, so it stays and is reused by other goals |
| A skill needs at least 4 active questions | An assessment asks 4 questions (`QUESTIONS_PER_ASSESSMENT`) |
| A skill can only be added to a goal when it has 4 active questions | Otherwise users could not be tested on it |
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
It still fails when a skill has fewer than 4 active questions.

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
| GET | `/admin/users/:userId` | | Profile, progress summary, skills with status and mastery, recent tests, advice |
| DELETE | `/admin/users/:userId` | | 200 `{ message }`. 400 for yourself, 409 for an admin |
| POST | `/admin/users/:userId/advice` | `message` (1-1000 characters) | 201 the advice |

The users list (`GET /admin/users`) and the role change (`PUT /admin/users/:userId/role`) already existed.

Users read their own advice with `GET /advice` (`{ advice, unread }`), `PATCH /advice/:adviceId/read` and `PATCH /advice/read-all` (`{ marked }`).

Errors use `{ message }` with 400 (invalid input or a rule above), 404 (not found) or 409 (duplicate).

## Tests

```bash
npm run test:db     # includes adminContent.test.ts (39 checks) and adminUsers.test.ts (19 checks)
```