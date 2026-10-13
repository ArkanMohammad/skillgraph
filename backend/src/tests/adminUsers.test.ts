/**
 * Tests for the admin user tools and the advice feature
 * (src/services/adminUsersService.ts and src/services/adviceService.ts).
 *  - Part 1 checks the input rules (no database needed).
 *  - Part 2 runs the real services against PostgreSQL.
 * Part 2 creates its own users (every email starts with "d16test_") and removes them at the end.
 * Run after `npm run migrate`, from the backend folder:
 *   npx ts-node --transpile-only src/tests/adminUsers.test.ts
 */
import assert from 'node:assert';
import { pool, query } from '../config/db';
import {
  AdviceError,
  MAX_ADVICE_LENGTH,
  countUnreadAdvice,
  createAdvice,
  listAdvice,
  markAdviceRead,
  markAllAdviceRead,
  parseAdviceInput,
} from '../services/adviceService';
import { AdminUserError, deleteUser, getUserDetail } from '../services/adminUsersService';

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

/** The work must fail with this error class and exactly this HTTP status */
const rejectsWith = async (
  status: number,
  work: () => unknown,
  errorClass: typeof AdviceError | typeof AdminUserError = AdminUserError
): Promise<void> => {
  try {
    await work();
  } catch (err) {
    assert.ok(err instanceof errorClass, `expected ${errorClass.name}, got ${(err as Error).message}`);
    assert.strictEqual((err as AdminUserError).status, status, `expected status ${status}: ${(err as Error).message}`);
    return;
  }
  assert.fail(`expected status ${status}, but nothing failed`);
};

async function partOne(): Promise<void> {
  console.log('--- Part 1: advice input rules ---');

  await test('the advice text is trimmed and kept', () => {
    assert.strictEqual(parseAdviceInput({ message: '  Practice every day.  ' }), 'Practice every day.');
  });

  await test('an empty or missing advice is rejected', () => {
    assert.throws(() => parseAdviceInput({ message: '   ' }), /cannot be empty/);
    assert.throws(() => parseAdviceInput({}), /cannot be empty/);
    assert.throws(() => parseAdviceInput(null), /cannot be empty/);
    assert.throws(() => parseAdviceInput({ message: 42 }), /cannot be empty/);
  });

  await test(`an advice longer than ${MAX_ADVICE_LENGTH} characters is rejected`, () => {
    assert.strictEqual(parseAdviceInput({ message: 'a'.repeat(MAX_ADVICE_LENGTH) }).length, MAX_ADVICE_LENGTH);
    assert.throws(() => parseAdviceInput({ message: 'a'.repeat(MAX_ADVICE_LENGTH + 1) }), /at most/);
  });
}

async function partTwo(): Promise<void> {
  console.log('--- Part 2: PostgreSQL ---');
  const stamp = Date.now();
  const createUser = async (label: string, role: 'USER' | 'ADMIN'): Promise<string> =>
    (
      await query<{ id: string }>(
        `INSERT INTO users (name, email, password_hash, role)
         VALUES ($1, $2, 'x', $3) RETURNING id`,
        [`d16test_${label}`, `d16test_${label}_${stamp}@example.com`, role]
      )
    ).rows[0].id;

  try {
    const admin = await createUser('admin', 'ADMIN');
    const otherAdmin = await createUser('admin2', 'ADMIN');
    const student = await createUser('student', 'USER');
    const lonely = await createUser('lonely', 'USER');
    const second = await createUser('second', 'USER');
    const reader = await createUser('reader', 'USER');

    // The student works toward the first seeded goal and has some progress
    const goal = (await query<{ id: number }>('SELECT goal_id AS id FROM goal_skills GROUP BY goal_id ORDER BY goal_id LIMIT 1')).rows[0];
    await query('INSERT INTO user_goals (user_id, goal_id, is_current) VALUES ($1, $2, TRUE)', [student, goal.id]);
    const firstSkill = (
      await query<{ skill_id: number }>('SELECT skill_id FROM goal_skills WHERE goal_id = $1 ORDER BY skill_id LIMIT 1', [goal.id])
    ).rows[0].skill_id;
    await query(
      `INSERT INTO user_skills (user_id, skill_id, proficiency_level, confidence, state)
       VALUES ($1, $2, 0.9, 0.9, 'MASTERED')`,
      [student, firstSkill]
    );

    await test('an advice is saved with the admin name and is unread', async () => {
      const item = await createAdvice(admin, student, 'Focus on the basics first.');
      assert.strictEqual(item.message, 'Focus on the basics first.');
      assert.strictEqual(item.adminName, 'd16test_admin');
      assert.strictEqual(item.readAt, null);
    });

    await test('an advice for an unknown user is rejected with 404', async () => {
      await rejectsWith(404, () => createAdvice(admin, '00000000-0000-4000-8000-000000000000', 'Hello'), AdviceError);
    });

    await test('the database refuses an advice longer than 1000 characters', async () => {
      await assert.rejects(
        () => query('INSERT INTO user_advice (user_id, admin_id, message) VALUES ($1, $2, $3)', [student, admin, 'a'.repeat(1001)]),
        /user_advice_message_check|violates check constraint/
      );
    });

    await test('the newest advice comes first and the limit works', async () => {
      await createAdvice(admin, student, 'Second advice');
      await createAdvice(otherAdmin, student, 'Third advice');
      const all = await listAdvice(student);
      assert.deepStrictEqual(all.map((item) => item.message), ['Third advice', 'Second advice', 'Focus on the basics first.']);
      assert.strictEqual((await listAdvice(student, 1)).length, 1);
    });

    await test('unread advice is counted and marking one as read lowers the count', async () => {
      assert.strictEqual(await countUnreadAdvice(student), 3);
      const [newest] = await listAdvice(student);
      await markAdviceRead(student, newest.id);
      assert.strictEqual(await countUnreadAdvice(student), 2);
      await markAdviceRead(student, newest.id); // marking twice is harmless
      assert.strictEqual(await countUnreadAdvice(student), 2);
    });

    await test('a user cannot mark the advice of another user', async () => {
      const [newest] = await listAdvice(student);
      await rejectsWith(404, () => markAdviceRead(lonely, newest.id), AdviceError);
    });

    await test('marking all as read clears only the unread advice of that user', async () => {
      await createAdvice(admin, reader, 'First for the reader');
      await createAdvice(admin, reader, 'Second for the reader');
      const [newest] = await listAdvice(reader);
      await markAdviceRead(reader, newest.id);

      assert.strictEqual(await markAllAdviceRead(reader), 1);
      assert.strictEqual(await countUnreadAdvice(reader), 0);
      assert.strictEqual(await markAllAdviceRead(reader), 0); // nothing left to change
      assert.strictEqual(await countUnreadAdvice(student), 2); // another user is not touched
    });

    await test('a user without a goal has an empty progress', async () => {
      const detail = await getUserDetail(lonely);
      assert.strictEqual(detail.currentGoal, null);
      assert.strictEqual(detail.summary, null);
      assert.deepStrictEqual(detail.skills, []);
      assert.strictEqual(detail.advice.length, 0);
    });

    await test('the detail of a user with a goal shows skills, progress and advice', async () => {
      const detail = await getUserDetail(student);
      assert.strictEqual(detail.email, `d16test_student_${stamp}@example.com`);
      assert.strictEqual(detail.currentGoal?.id, goal.id);
      assert.ok(detail.skills.length > 0);
      assert.strictEqual(detail.summary?.totalSkills, detail.skills.length);
      assert.strictEqual(detail.advice.length, 3);

      const mastered = detail.skills.find((skill) => skill.id === firstSkill);
      assert.strictEqual(mastered?.state, 'MASTERED');
      assert.strictEqual(mastered?.mastery, 90);
      assert.ok(detail.summary!.masteredSkills >= 1);
    });

    await test('the detail of an unknown user is 404', async () => {
      await rejectsWith(404, () => getUserDetail('00000000-0000-4000-8000-000000000000'));
    });

    await test('an admin cannot delete themselves', async () => {
      await rejectsWith(400, () => deleteUser(admin, admin));
    });

    await test('an admin account cannot be deleted before it is changed to USER', async () => {
      await rejectsWith(409, () => deleteUser(admin, otherAdmin));
      const still = await query('SELECT 1 FROM users WHERE id = $1', [otherAdmin]);
      assert.strictEqual(still.rowCount, 1);
    });

    await test('deleting an unknown user is 404', async () => {
      await rejectsWith(404, () => deleteUser(admin, '00000000-0000-4000-8000-000000000000'));
    });

    await test('deleting a user removes their goals, skills and advice', async () => {
      const removed = await deleteUser(admin, student);
      assert.strictEqual(removed.name, 'd16test_student');
      for (const table of ['users', 'user_goals', 'user_skills', 'user_advice']) {
        const column = table === 'users' ? 'id' : 'user_id';
        const left = await query(`SELECT 1 FROM ${table} WHERE ${column} = $1`, [student]);
        assert.strictEqual(left.rowCount, 0, `${table} still has rows of the deleted user`);
      }
    });

    await test('other users are not touched when one user is deleted', async () => {
      await createAdvice(admin, second, 'Keep going');
      await deleteUser(admin, lonely);
      assert.strictEqual((await listAdvice(second)).length, 1);
    });

    await test('advice stays when the admin who wrote it is deleted', async () => {
      await query('DELETE FROM users WHERE id = $1', [otherAdmin]);
      const items = await listAdvice(second);
      assert.strictEqual(items.length, 1);
      await createAdvice(admin, second, 'Another one');
      await query('DELETE FROM users WHERE id = $1', [admin]);
      const after = await listAdvice(second);
      assert.strictEqual(after.length, 2);
      assert.ok(after.every((item) => item.adminName === null));
    });
  } finally {
    await query(`DELETE FROM users WHERE email LIKE $1`, [`d16test_%_${stamp}@example.com`]);
  }
}

async function main(): Promise<void> {
  await partOne();
  await partTwo();
  console.log(`\n${passed} passed, ${failed} failed`);
  await pool.end();
  if (failed > 0) process.exit(1);
}

main().catch(async (err) => {
  console.error(err);
  await pool.end().catch(() => undefined);
  process.exit(1);
});