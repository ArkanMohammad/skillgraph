/**
 * Tests for the public check of a recommendation code (src/services/verifyService.ts)
 * against PostgreSQL: the code format, what a visitor may see (the paper) and what stays private (emails).
 * Every record it creates starts with "d19vtest_" and is removed at the end.
 * Run after `npm run migrate`, from the backend folder:
 *   npx ts-node --transpile-only src/tests/verifyRecommendation.test.ts
 */
import assert from 'node:assert';
import { pool, query } from '../config/db';
import { ProjectShareError, createShare, writeRecommendation } from '../services/projectShareService';
import { normalizeCode, verifyRecommendation } from '../services/verifyService';

let passed = 0;
let failed = 0;

const test = async (name: string, fn: () => Promise<void> | void): Promise<void> => {
  try {
    await fn();
    passed += 1;
    console.log(`ok    ${name}`);
  } catch (err) {
    failed += 1;
    console.log(`FAIL  ${name}\n      ${(err as Error).message}`);
  }
};

/** The work must fail with a ProjectShareError that has exactly this HTTP status */
const rejectsWith = async (status: number, work: () => Promise<unknown>): Promise<void> => {
  try {
    await work();
  } catch (err) {
    assert.ok(err instanceof ProjectShareError, `expected ProjectShareError, got ${(err as Error).message}`);
    assert.strictEqual((err as ProjectShareError).status, status, `expected status ${status}: ${(err as Error).message}`);
    return;
  }
  assert.fail(`expected status ${status}, but nothing failed`);
};

const PNG_HEAD = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const SIGNATURE = `data:image/png;base64,${Buffer.concat([PNG_HEAD, Buffer.alloc(200, 7)]).toString('base64')}`;
const PROJECT_DESCRIPTION = 'A small portfolio website built with React and TypeScript, with three pages.';
const BODY = 'Sara built a clean, well structured project and explained every decision clearly. I recommend her.';

async function main(): Promise<void> {
  const stamp = Date.now();
  const createUser = async (label: string, role = 'USER'): Promise<string> =>
    (
      await query<{ id: string }>(
        `INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, 'x', $3) RETURNING id`,
        [`d19vtest_${label}`, `d19vtest_${label}_${stamp}@example.com`, role]
      )
    ).rows[0].id;

  const goal = (await query<{ id: number }>('INSERT INTO goals (name) VALUES ($1) RETURNING id', [`d19vtest_goal_${stamp}`])).rows[0].id;
  const mentor = await createUser('mentor', 'MENTOR');
  const learner = await createUser('learner');
  await query('INSERT INTO goal_mentors (goal_id, mentor_id) VALUES ($1, $2)', [goal, mentor]);
  await query('INSERT INTO user_goals (user_id, goal_id, is_current) VALUES ($1, $2, TRUE)', [learner, goal]);

  const shareId = await createShare(learner, {
    mentorId: mentor,
    title: 'Personal portfolio',
    description: PROJECT_DESCRIPTION,
    projectUrl: null,
  });
  const code = await writeRecommendation(mentor, shareId, { body: BODY, mentorTitle: 'Senior Engineer', signature: SIGNATURE });

  try {
    console.log('--- Code format ---');

    await test('normalizeCode accepts lower case, spaces and missing dashes', () => {
      assert.strictEqual(normalizeCode('sg-7kq2-m9xd-4tpa'), 'SG-7KQ2-M9XD-4TPA');
      assert.strictEqual(normalizeCode(' sg 7kq2 m9xd 4tpa '), 'SG-7KQ2-M9XD-4TPA');
      assert.strictEqual(normalizeCode('SG7KQ2M9XD4TPA'), 'SG-7KQ2-M9XD-4TPA');
    });

    await test('a code that cannot exist is refused (400)', async () => {
      await rejectsWith(400, () => verifyRecommendation(''));
      await rejectsWith(400, () => verifyRecommendation('hello'));
      await rejectsWith(400, () => verifyRecommendation('SG-12-34-56'));
      await rejectsWith(400, () => verifyRecommendation(undefined));
      await rejectsWith(400, () => verifyRecommendation({ code }));
      await rejectsWith(400, () => verifyRecommendation("SG-AAAA-BBBB-CCCC' OR '1'='1"));
    });

    await test('a well formed code that nobody owns is not found (404)', async () => {
      await rejectsWith(404, () => verifyRecommendation('SG-AAAA-AAAA-AAAA'));
    });

    console.log('\n--- What a visitor sees ---');

    await test('a real code returns the recommendation and who it is for', async () => {
      const result = await verifyRecommendation(code);
      assert.strictEqual(result.code, code);
      assert.strictEqual(result.projectTitle, 'Personal portfolio');
      assert.strictEqual(result.projectDescription, PROJECT_DESCRIPTION);
      assert.strictEqual(result.learnerName, 'd19vtest_learner');
      assert.strictEqual(result.goalName, `d19vtest_goal_${stamp}`);
      assert.strictEqual(result.mentorName, 'd19vtest_mentor');
      assert.strictEqual(result.mentorTitle, 'Senior Engineer');
      assert.strictEqual(result.body, BODY);
      assert.strictEqual(result.signature, SIGNATURE);
      assert.ok(!Number.isNaN(Date.parse(result.issuedAt)));
    });

    await test('the code can be typed in lower case', async () => {
      const result = await verifyRecommendation(code.toLowerCase());
      assert.strictEqual(result.code, code);
    });

    await test('no email is given away, and no project link', async () => {
      const text = JSON.stringify(await verifyRecommendation(code));
      assert.ok(!text.includes('@example.com'));
      assert.ok(!text.includes('github.com'));
    });

    console.log('\n--- Lifetime ---');

    await test('the recommendation stays valid when the mentor account is deleted', async () => {
      await query('DELETE FROM users WHERE id = $1', [mentor]);
      const result = await verifyRecommendation(code);
      assert.strictEqual(result.mentorName, 'd19vtest_mentor');
    });

    await test('the code stops working when the learner account is deleted', async () => {
      await query('DELETE FROM users WHERE id = $1', [learner]);
      await rejectsWith(404, () => verifyRecommendation(code));
    });
  } finally {
    await query(`DELETE FROM users WHERE email LIKE $1`, [`d19vtest_%_${stamp}@example.com`]);
    await query(`DELETE FROM goals WHERE name LIKE $1`, [`d19vtest_%_${stamp}`]);
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