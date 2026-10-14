/**
 * Database-backed tests for the review queue (src/services/reviewService.ts).
 * Run the seed first, then from the backend folder:
 *   npx ts-node --transpile-only src/tests/reviewDb.test.ts
 * It creates a temporary user and deletes it at the end (nothing else is touched).
 */
import assert from 'node:assert';
import { pool, query } from '../config/db';
import { completeAssessment, startAssessment, submitAnswer } from '../services/assessmentService';
import { RecommendationError } from '../services/recommendationService';
import { getReviewQueue } from '../services/reviewService';

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

/**
 * Stores a skill as tested `daysAgo` days ago (null = no test date at all).
 * One extra hour is subtracted on purpose: the date comes from the clock of the database and the
 * test measures it with the clock of this computer. Without the margin, a clock that is a few
 * seconds apart turns "exactly 40 days" into 39 days and the test fails for no real reason.
 */
const setSkill = async (
  userId: string,
  skill: string,
  mastery: number,
  confidence: number,
  daysAgo: number | null
): Promise<void> => {
  await query(
    `INSERT INTO user_skills (user_id, skill_id, proficiency_level, confidence, state, last_assessed_at)
     VALUES ($1, $2, $3, $4, 'PRACTICING', CASE WHEN $5::int IS NULL THEN NULL ELSE NOW() - ($5::int * INTERVAL '1 day') - INTERVAL '1 hour' END)
     ON CONFLICT (user_id, skill_id) DO UPDATE
     SET proficiency_level = EXCLUDED.proficiency_level,
         confidence = EXCLUDED.confidence,
         last_assessed_at = EXCLUDED.last_assessed_at`,
    [userId, await skillId(skill), mastery, confidence, daysAgo]
  );
};

/** Answers every question of a skill correctly and completes the assessment */
const passAssessment = async (userId: string, skill: string): Promise<void> => {
  const started = await startAssessment(userId, await skillId(skill));
  let question = started.question;
  while (question) {
    const option = await query<{ id: number }>(
      'SELECT id FROM question_options WHERE question_id = $1 AND is_correct = TRUE ORDER BY id LIMIT 1',
      [question.id]
    );
    const answer = await submitAnswer(userId, started.assessmentId, question.id, option.rows[0].id);
    question = answer.question;
    if (answer.finished) break;
  }
  await completeAssessment(userId, started.assessmentId);
};

async function main(): Promise<void> {
  const email = `review-test-${Date.now()}@example.com`;
  const created = await query<{ id: string }>(
    `INSERT INTO users (name, email, password_hash) VALUES ('Review Test', $1, 'x') RETURNING id`,
    [email]
  );
  const userId = created.rows[0].id;

  try {
    const fullStack = await goalId('Full Stack Developer');

    await test('no current goal gives a clear 400 error', async () => {
      await assert.rejects(
        () => getReviewQueue(userId),
        (err: unknown) => err instanceof RecommendationError && err.status === 400
      );
    });

    await setGoal(userId, fullStack);

    await test('a new user has an empty queue', async () => {
      const queue = await getReviewQueue(userId);
      assert.strictEqual(queue.goal.name, 'Full Stack Developer');
      assert.deepStrictEqual(queue.items, []);
      assert.strictEqual(queue.dueCount + queue.fadingCount + queue.freshCount, 0);
      assert.strictEqual(queue.nextReviewAt, null);
    });

    // HTML tested today, CSS 15 days ago, Git 40 days ago (all mastered, confidence 0.8)
    await setSkill(userId, 'HTML', 1, 0.8, 0);
    await setSkill(userId, 'CSS', 1, 0.8, 15);
    await setSkill(userId, 'Git', 1, 0.8, 40);

    await test('mastered skills are listed with fresh, fading and due status', async () => {
      const queue = await getReviewQueue(userId);
      const byName = new Map(queue.items.map((item) => [item.skillName, item]));
      assert.strictEqual(byName.get('HTML')?.status, 'FRESH');
      assert.strictEqual(byName.get('CSS')?.status, 'FADING');
      assert.strictEqual(byName.get('Git')?.status, 'DUE');
      assert.strictEqual(queue.freshCount, 1);
      assert.strictEqual(queue.fadingCount, 1);
      assert.strictEqual(queue.dueCount, 1);
    });

    await test('the most forgotten skill comes first', async () => {
      const queue = await getReviewQueue(userId);
      assert.deepStrictEqual(
        queue.items.map((item) => item.skillName),
        ['Git', 'CSS', 'HTML']
      );
      const retentions = queue.items.map((item) => item.retention);
      assert.deepStrictEqual(retentions, [...retentions].sort((a, b) => a - b));
    });

    await test('effective mastery is lower than the stored mastery once memory fades', async () => {
      const queue = await getReviewQueue(userId);
      const git = queue.items.find((item) => item.skillName === 'Git');
      assert.ok(git);
      assert.strictEqual(git?.mastery, 100);
      assert.ok((git?.effectiveMastery ?? 100) < 100);
      assert.strictEqual(git?.daysSinceTest, 40);
      assert.strictEqual(git?.daysUntilReview, 0);
    });

    await test('nextReviewAt is the earliest date among skills that are not due yet', async () => {
      const queue = await getReviewQueue(userId);
      const css = queue.items.find((item) => item.skillName === 'CSS');
      assert.strictEqual(queue.nextReviewAt, css?.nextReviewAt);
    });

    await test('stored mastery is not changed by decay', async () => {
      await getReviewQueue(userId);
      const row = await query<{ proficiency_level: string }>(
        'SELECT proficiency_level FROM user_skills WHERE user_id = $1 AND skill_id = $2',
        [userId, await skillId('Git')]
      );
      assert.strictEqual(Number(row.rows[0].proficiency_level), 1);
    });

    await test('skills that are not mastered are left out (low confidence, low mastery, no test date)', async () => {
      await setSkill(userId, 'SQL', 1, 0.4, 50); // not enough confidence
      await setSkill(userId, 'JavaScript', 0.1, 0.9, 50); // not enough mastery
      await setSkill(userId, 'Node.js', 1, 0.9, null); // never tested
      const names = (await getReviewQueue(userId)).items.map((item) => item.skillName);
      assert.ok(!names.includes('SQL'));
      assert.ok(!names.includes('JavaScript'));
      assert.ok(!names.includes('Node.js'));
    });

    await test('mastered skills that are not in the current goal are left out', async () => {
      const outside = await query<{ name: string }>(
        `SELECT s.name FROM skills s
         WHERE s.id NOT IN (SELECT skill_id FROM goal_skills WHERE goal_id = $1) LIMIT 1`,
        [fullStack]
      );
      if (outside.rows.length === 0) return; // every skill belongs to this goal
      await setSkill(userId, outside.rows[0].name, 1, 0.9, 60);
      const names = (await getReviewQueue(userId)).items.map((item) => item.skillName);
      assert.ok(!names.includes(outside.rows[0].name));
    });

    await test('a later date makes every skill due (the clock is injectable)', async () => {
      const farFuture = new Date(Date.now() + 400 * 24 * 60 * 60 * 1000);
      const queue = await getReviewQueue(userId, farFuture);
      assert.ok(queue.items.length >= 3);
      assert.strictEqual(queue.dueCount, queue.items.length);
      assert.strictEqual(queue.nextReviewAt, null);
    });

    await test('a review (new test) restarts the curve of a due skill', async () => {
      const before = (await getReviewQueue(userId)).items.find((item) => item.skillName === 'Git');
      assert.strictEqual(before?.status, 'DUE');
      await passAssessment(userId, 'Git');
      const after = (await getReviewQueue(userId)).items.find((item) => item.skillName === 'Git');
      assert.strictEqual(after?.status, 'FRESH');
      assert.strictEqual(after?.daysSinceTest, 0);
      assert.strictEqual(after?.retention, 100);
    });
  } finally {
    await query('DELETE FROM users WHERE id = $1', [userId]);
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  await pool.end();
  if (failed > 0) process.exit(1);
}

main().catch(async (err) => {
  console.error(err);
  await pool.end().catch(() => undefined);
  process.exit(1);
});