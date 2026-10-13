# Knowledge decay and review

People forget. A skill mastered months ago is not as safe as one mastered yesterday, so SkillGraph
shows how well each mastered skill is **still remembered today** and tells the user what to review.

## How it works

The stored mastery in the database is never changed. Decay is calculated live from the date of the
last test (`user_skills.last_assessed_at`), so there is no migration and nothing can be lost.

```
retention = 0.5 ^ (daysSinceLastTest / halfLife)
halfLife  = 14 + 46 * confidence      (days, confidence is 0-1)
effective mastery = stored mastery * retention
```

- A high confidence is forgotten more slowly: 14 days of half-life at confidence 0, 60 days at 1.
- A skill counts as mastered here when its mastery reaches the goal's requirement and its confidence
  is at least 0.7 (the same rule as the rest of the app). Skills that were never tested are skipped.
- Only the skills of the current goal are listed.

| Retention | Status | Meaning |
| --- | --- | --- |
| 85% or more | `FRESH` | Still safe |
| 70% to 84% | `FADING` | Review soon |
| below 70% | `DUE` | Review now |

At confidence 0.7 a skill becomes due about 24 days after the test; at confidence 1 about 31 days.

## Review = a new test

A review is the normal test of the skill (`/user/assessment/skill/:id`). Finishing it sets
`last_assessed_at` to now, which restarts the curve. A weaker result never lowers the stored mastery
(existing rule), but the test still counts as a fresh practice.

## API

| Method | Path | Answer |
| --- | --- | --- |
| GET | `/api/review` | `goal`, `items` (most forgotten first), `dueCount`, `fadingCount`, `freshCount`, `nextReviewAt` |

Every item has: `skillId`, `skillName`, `category`, `mastery`, `requiredMastery`, `lastAssessedAt`,
`retention`, `effectiveMastery`, `daysSinceTest`, `halfLifeDays`, `status`, `nextReviewAt`,
`daysUntilReview`. Without a current goal the answer is `400 Select a goal first`.

## Where the code is

| Part | File |
| --- | --- |
| Maths (pure, tested) | `backend/src/services/algorithm/knowledgeDecay.ts` |
| Database query and sorting | `backend/src/services/reviewService.ts` |
| Route | `backend/src/routes/reviewRoutes.ts` |
| Dashboard card | `frontend/src/components/ReviewCard.tsx` |

## Trying it by hand

Make a mastered skill look old, then open the Dashboard (replace the email and skill name):

```sql
UPDATE user_skills SET last_assessed_at = NOW() - INTERVAL '40 days'
WHERE user_id = (SELECT id FROM users WHERE email = 'you@example.com')
  AND skill_id = (SELECT id FROM skills WHERE name = 'HTML');
```