# Admin content management

Admins (role `ADMIN`) can change what users are tested on and what every goal contains,
without touching the code or the database. Everything is in `backend/src/services/adminContentService.ts`
and exposed under `/api/admin` (see `backend/src/routes/adminContentRoutes.ts`).

## What an admin can do

| Area | Actions |
| --- | --- |
| Skills | create a skill, edit its name, category and description |
| Questions | add a question (4 options, exactly one correct), edit it, hide or show it |
| Goal skills | add an existing skill to a goal, change its required mastery, importance and hours, remove it from the goal |

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

A new skill starts with one concept called `General` (weight 1), so its questions can be attached to it.
Prerequisites between skills are not editable yet, so a new skill has none and is READY as soon as it is in a goal.

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

Errors use `{ message }` with 400 (invalid input or a rule above), 404 (not found) or 409 (duplicate).

## Tests

```bash
npm run test:db     # includes src/tests/adminContent.test.ts
```