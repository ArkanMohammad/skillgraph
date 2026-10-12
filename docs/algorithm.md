# SkillGraph algorithm

The algorithm lives in `backend/src/services/algorithm/`. All of it is pure code
(no database, no HTTP), so it is easy to test.

## 1. Inputs and outputs

**Input** (`GoalGraphData`): the skills of one goal (required mastery, importance,
estimated hours), the prerequisite edges between them, and the user's progress
(mastery and confidence from 0 to 1 per skill; a skill never assessed has none).

**Output** (`Recommendation`): `goalComplete`, the `next` skill, and all `candidates`
ranked best first. Every ranked skill carries its five factor scores, how many utility
points each factor gave, and a human explanation.

## 2. Skill states

| State | Rule |
| --- | --- |
| MASTERED | `mastery >= requiredMastery` AND `confidence >= 0.70` |
| READY | not mastered, and every prerequisite reached its required mastery |
| LOCKED | not mastered, and at least one prerequisite is not satisfied |

Only READY skills are candidates for the Next Best Skill.

## 3. Factors (each from 0 to 100)

| Factor | Meaning | Formula |
| --- | --- | --- |
| goalImpact | How important the skill is for the goal | `importance * 100` |
| readiness | How well the prerequisites are known | importance-weighted average of `min(mastery / required, 1)` over the prerequisites; no prerequisites = 100 |
| unlockPotential | How much it opens up | breadth-first walk over the skills that come after it; sum the importance of the not-mastered ones; scaled by the biggest value among the candidates |
| gapPriority | How much is still missing | `(required - mastery) / required * 100` |
| timeEfficiency | Cheaper skills first | min-max inverted over the candidates' estimated hours; all equal = 100 |

## 4. Utility

```
utility = 0.30 goalImpact + 0.25 readiness + 0.20 unlockPotential
        + 0.15 gapPriority + 0.10 timeEfficiency
```

Candidates are sorted by utility. Ties go to the higher goalImpact, then the lower skill id,
so the result is always stable.

## 5. Explanation

For the winner the system keeps the strongest factors (score of 60 or more, at most three),
counts how many not-mastered skills come after it (BFS), and reports the margin over the
runner-up. The summary sentence is built from these facts only.

## 6. Assessment and scoring

1. The first question has difficulty 2 (medium).
2. A correct answer makes the next target one level harder (max 3), a wrong one one level easier (min 1).
3. From the unanswered questions the server picks the one closest to the target,
   preferring the concept that was asked the least. An assessment asks 4 questions.
4. The correct answer is revealed only after the answer is saved.
5. Concept score = difficulty-weighted share of correct answers (difficulty 1/2/3 = weight 1/2/3).
   Skill score = concept scores averaged with the concept weights; concepts not asked are left out.
6. Confidence = `0.5 coverage + 0.2 sampleSize + 0.3 consistency`.

## 7. Replanning

When an assessment is completed, the mastery and confidence of the skill are saved in one
transaction. After the commit the recommendation is calculated again, so the response contains
the new `nextRecommendation`. Mastering a skill can unlock new READY skills.

## 8. Progress and changing the goal

Mastery is stored per user and skill (`user_skills`), not per goal. Skills are shared between
goals, so changing the goal never copies or duplicates anything: the new goal simply reads the
rows that already exist.

`summarizeProgress` (`progressSummary.ts`) builds the Progress page:

| Number | Rule |
| --- | --- |
| percent | importance-weighted average of `min(mastery / required, 1)` over the skills of the goal |
| masteredSkills | skills that are MASTERED (same rule as section 2) |
| hoursRemaining | for every skill that is not mastered: `estimatedHours x gap / required`, rounded up |
| categories | the same numbers grouped by skill category |

The percent moves after every assessment, not only when a skill becomes MASTERED. The goal
selection screen uses one SQL query (`progressForAllGoals`) with the same formula to show how
much of every goal is already covered.

## 9. Worked example

Goal with three skills: A (no prerequisites), B requires A, C requires A.
All have required mastery 0.7, importance 0.8, 10 hours.
With no progress only A is READY, so A is the Next Best Skill.
After A is mastered (mastery 0.8, confidence 0.8), B and C become READY and are ranked
by utility; the tests in `src/tests/` check this behaviour (`replanning: mastering A unlocks B`).