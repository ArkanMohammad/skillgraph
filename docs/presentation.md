# SkillGraph: final presentation

Target length: 10 minutes + 3 minutes for questions.

## Slide 1: The problem (45 sec)

- A learner knows the career they want, but not where they stand, what is missing,
  or what to study next.
- Courses give a fixed order. SkillGraph gives a personal order.

Say: "SkillGraph answers three questions: where am I, what am I missing, and what is the best next step."

## Slide 2: The idea (45 sec)

- Skills are nodes, prerequisites are directed edges with a required mastery.
- One generic algorithm for every career goal. No career is hardcoded.
- 7 goals: Full Stack, Frontend, Backend, Data Analyst, Cybersecurity, UI/UX Designer, DevOps.

## Slide 3: Architecture (1 min)

- Frontend: React, TypeScript, Vite, React Router, Redux Toolkit, React Flow.
- Backend: Node, Express, TypeScript, JWT in an httpOnly cookie, bcrypt.
- Database: PostgreSQL with constraints, a migrations runner and performance indexes.
- The algorithm is pure code (no database, no HTTP), so it is fully testable.

## Slide 4: The algorithm (2 min)

- States: MASTERED, READY, LOCKED.
- MASTERED means mastery >= required AND confidence >= 0.70.
- Utility = 0.30 goalImpact + 0.25 readiness + 0.20 unlockPotential
  + 0.15 gapPriority + 0.10 timeEfficiency.
- Every recommendation is explainable: the strongest factors, how many skills it unlocks,
  and the margin over the runner-up.

Say: "The weights are engineering parameters. The system never says 'learn this' without saying why."

## Slide 5: Adaptive assessment (1 min)

- 4 questions per skill. Difficulty goes up after a correct answer and down after a wrong one.
- The server picks the questions and reveals the correct answer only after saving the answer.
- Score is difficulty-weighted. Confidence = 0.5 coverage + 0.2 sample size + 0.3 consistency.

## Slide 6: Live demo (3 min)

Follow `docs/demo.md`. Short path:
1. Log in as `demo.midway@skillgraph.dev` (password `Demo1234!`).
2. Dashboard: the Next Best Skill and its explanation.
3. Skill graph: click a node and show the detail panel.
4. Take an assessment, finish it, and show the replanned recommendation.
5. Progress page: the percent moved.
6. Change the goal and show that the progress is reused, not copied.

## Slide 7: Quality (45 sec)

- Unit tests for the algorithm and goal change.
- 20 PostgreSQL constraint tests (SQLSTATE 23505, 23503, 23514, 22P02).
- `check:deploy` and `check:seed` scripts before every release.
- Error states in every page and a global error boundary.

## Slide 8: What we learned and what is next (45 sec)

- Learned: pure algorithm code, migrations, same-origin proxy for cookies, Git workflow with PR reviews.
- Next: more skills and questions per goal, an optional AI layer for explanations,
  spaced repetition for confidence decay.

## Questions we should be ready for

| Question | Short answer |
| --- | --- |
| Why not machine learning? | The data is small and the user must understand the reason. A transparent formula is explainable. |
| How are the weights chosen? | As engineering parameters. They are in one place and easy to change. |
| What if the user changes the goal? | Mastery is stored per user and skill, so shared skills keep their progress. |
| Why is the cookie httpOnly? | JavaScript cannot read it, so XSS cannot steal the token. We also do not use localStorage. |
| How do you stop cheating? | The correct answer is revealed only after the answer is saved. |
| Why PostgreSQL? | The graph is small and relational. Constraints protect data quality. No Neo4j needed. |