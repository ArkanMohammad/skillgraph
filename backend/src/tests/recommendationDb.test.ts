/**
 * Database-backed tests: the real seeded database + the real services.
 * Run the seed first, then from the backend folder:
 *   npx ts-node --transpile-only src/tests/recommendationDb.test.ts
 * It creates a temporary user and deletes it at the end (nothing else is touched).
 */
import assert from 'node:assert';
import { pool, query } from '../config/db';
import { completeAssessment, startAssessment, submitAnswer } from '../services/assessmentService';
import {
  RecommendationError,
  loadGoalGraphData,
  recommendNextSkill,
} from '../services/recommendationService';
import { getSkillStates } from '../services/algorithm/recommendationEngine';

let passed = 0;
let failed = 0;

const test = async (name: string, fn: () => Promise<void>): Promise<void> => {
  try {
    await fn();
    passed += 1;
    console.log(`ok    ${name}`);
  } catch (err) {
    failed += 1;
    console.log(`FAIL  ${name}\n      ${(err as Error).message}`);
  }
};

const goalId = async (name: string): Promise<number> =>
  (await query<{ id: number }>('SELECT id FROM goals WHERE name = $1', [name])).rows[0].id;

const skillId = async (name: string): Promise<number> =>
  (await query<{ id: number }>('SELECT id FROM skills WHERE name = $1', [name])).rows[0].id;

const setGoal = async (userId: string, goal: number): Promise<void> => {
  await query('UPDATE user_goals SET is_current = FALSE WHERE user_id = $1', [userId]);
  await query(
    `INSERT INTO user_goals (user_id, goal_id, is_current) VALUES ($1, $2, TRUE)
     ON CONFLICT (user_id, goal_id) DO UPDATE SET is_current = TRUE`,
    [userId, goal]
  );
};

const setMastery = async (userId: string, skill: string, mastery: number, confidence: number): Promise<void> => {
  await query(
    `INSERT INTO user_skills (user_id, skill_id, proficiency_level, confidence, state)
     VALUES ($1, $2, $3, $4, 'PRACTICING')
     ON CONFLICT (user_id, skill_id) DO UPDATE
     SET proficiency_level = EXCLUDED.proficiency_level, confidence = EXCLUDED.confidence`,
    [userId, await skillId(skill), mastery, confidence]
  );
};

const candidateNames = async (userId: string): Promise<string[]> =>
  (await recommendNextSkill(userId)).candidates.map((candidate) => candidate.skillName);

/** Answers every question of a skill correctly (or wrongly) and completes the assessment */
const passAssessment = async (userId: string, skill: string, correct: boolean): Promise<void> => {
  const started = await startAssessment(userId, await skillId(skill));
  let question = started.question;
  while (question) {
    const option = await query<{ id: number }>(
      'SELECT id FROM question_options WHERE question_id = $1 AND is_correct = $2 ORDER BY id LIMIT 1',
      [question.id, correct]
    );
    const answer = await submitAnswer(userId, started.assessmentId, question.id, option.rows[0].id);
    question = answer.question;
    if (answer.finished) break;
  }
  await completeAssessment(userId, started.assessmentId);
};

async function main(): Promise<void> {
  const email = `engine-test-${Date.now()}@example.com`;
  const created = await query<{ id: string }>(
    `INSERT INTO users (name, email, password_hash) VALUES ('Engine Test', $1, 'x') RETURNING id`,
    [email]
  );
  const userId = created.rows[0].id;

  try {
    const fullStack = await goalId('Full Stack Developer');
    const frontend = await goalId('Frontend Developer');
    const dataAnalyst = await goalId('Data Analyst');

    await test('no current goal gives a clear 400 error', async () => {
      await assert.rejects(
        () => recommendNextSkill(userId),
        (err: unknown) => err instanceof RecommendationError && err.status === 400
      );
    });

    await setGoal(userId, fullStack);

    await test('new user: only skills without prerequisites inside the goal are candidates', async () => {
      assert.deepStrictEqual((await candidateNames(userId)).sort(), ['Git', 'HTML', 'SQL']);
    });

    await test('new user: the recommendation has factor scores and a valid utility', async () => {
      const result = await recommendNextSkill(userId);
      assert.strictEqual(result.goal.name, 'Full Stack Developer');
      assert.ok(result.next);
      assert.strictEqual(result.next?.status, 'READY');
      assert.strictEqual(Object.keys(result.next?.factors ?? {}).length, 5);
      assert.ok((result.next?.utilityScore ?? -1) >= 0 && (result.next?.utilityScore ?? 101) <= 100);
      // Candidates come sorted by utility
      const scores = result.candidates.map((candidate) => candidate.utilityScore);
      assert.deepStrictEqual(scores, [...scores].sort((a, b) => b - a));
    });

    await test('mastering HTML unlocks CSS and JavaScript and removes HTML', async () => {
      await setMastery(userId, 'HTML', 0.8, 0.8);
      const names = await candidateNames(userId);
      assert.ok(!names.includes('HTML'));
      assert.ok(names.includes('CSS') && names.includes('JavaScript'));
      assert.ok(!names.includes('React')); // still needs JavaScript
    });

    await test('low confidence keeps the skill as a candidate (needs a new assessment)', async () => {
      await setMastery(userId, 'HTML', 0.9, 0.4);
      assert.ok((await candidateNames(userId)).includes('HTML'));
      await setMastery(userId, 'HTML', 0.8, 0.8);
    });

    await test('goal change reuses the existing mastery', async () => {
      try {
        await setGoal(userId, frontend);
        const names = await candidateNames(userId);
        assert.ok(!names.includes('HTML')); // already mastered, even though the goal changed
        assert.ok(names.includes('CSS') && names.includes('JavaScript'));
        await setGoal(userId, dataAnalyst);
        const other = await candidateNames(userId);
        assert.ok(!other.includes('HTML')); // not part of this goal at all
      } finally {
        await setGoal(userId, fullStack); // Always go back, so one failure does not break the next tests
      }
    });

    await test('a skill with an unmet prerequisite is LOCKED in the graph states', async () => {
      const data = await loadGoalGraphData(userId, fullStack);
      assert.ok(data);
      const states = getSkillStates(data!);
      assert.strictEqual(states.get(await skillId('React')), 'LOCKED');
      assert.strictEqual(states.get(await skillId('HTML')), 'MASTERED');
      assert.strictEqual(states.get(await skillId('CSS')), 'READY');
    });

    await test('prerequisites outside the goal are ignored', async () => {
      const data = await loadGoalGraphData(userId, fullStack);
      const ids = new Set(data!.skills.map((skill) => skill.skillId));
      assert.ok(data!.edges.every((edge) => ids.has(edge.skillId) && ids.has(edge.prerequisiteId)));
    });

    await test('completing an assessment with correct answers changes the next recommendation', async () => {
      await query('DELETE FROM user_skills WHERE user_id = $1', [userId]);
      const before = (await recommendNextSkill(userId)).next?.skillName;
      assert.ok(before);
      await passAssessment(userId, before as string, true);
      const after = await recommendNextSkill(userId);
      assert.ok(!after.candidates.map((candidate) => candidate.skillName).includes(before as string));
      assert.notStrictEqual(after.next?.skillName, before);
    });

    await test('a failed assessment keeps the skill as a candidate', async () => {
      const current = (await recommendNextSkill(userId)).next?.skillName as string;
      await passAssessment(userId, current, false);
      assert.ok((await candidateNames(userId)).includes(current));
    });

    await test('when all goal skills are mastered goalComplete is true', async () => {
      const data = await loadGoalGraphData(userId, fullStack);
      for (const skill of data!.skills) await setMastery(userId, skill.name, 1, 1);
      const result = await recommendNextSkill(userId);
      assert.strictEqual(result.goalComplete, true);
      assert.strictEqual(result.next, null);
      assert.deepStrictEqual(result.candidates, []);
    });

    await test('the three queries of the graph load are fast on the seeded data', async () => {
      const startedAt = Date.now();
      for (let i = 0; i < 20; i += 1) await loadGoalGraphData(userId, fullStack);
      const average = (Date.now() - startedAt) / 20;
      console.log(`      average load time: ${average.toFixed(1)} ms`);
      assert.ok(average < 200);
    });

    await test('constraints: mastery above 1 and unknown skill are rejected by PostgreSQL', async () => {
      await assert.rejects(() =>
        query(`INSERT INTO user_skills (user_id, skill_id, proficiency_level) VALUES ($1, 1, 1.5)`, [userId])
      );
      await assert.rejects(() =>
        query(`INSERT INTO user_skills (user_id, skill_id, proficiency_level) VALUES ($1, 999999, 0.5)`, [userId])
      );
    });
  } finally {
    await query('DELETE FROM users WHERE id = $1', [userId]); // Cascades to the user's data
    await pool.end();
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error('Test run crashed:', err);
  process.exit(1);
});