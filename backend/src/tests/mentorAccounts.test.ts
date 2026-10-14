/**
 * Tests for "an admin creates a mentor account" (src/services/mentorService.ts) against PostgreSQL:
 * the form rules, the new account with the role MENTOR, the goals it starts with and the failures.
 * Every record it creates starts with "d19test_" and is removed at the end.
 * Run after `npm run migrate`, from the backend folder:
 *   npx ts-node --transpile-only src/tests/mentorAccounts.test.ts
 */
import assert from 'node:assert';
import bcrypt from 'bcrypt';
import { pool, query } from '../config/db';
import { MentorError, createMentorAccount, listMentors, parseNewMentorInput } from '../services/mentorService';

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

/** The work must fail with a MentorError that has exactly this HTTP status */
const rejectsWith = async (status: number, work: () => Promise<unknown> | unknown): Promise<void> => {
  try {
    await work();
  } catch (err) {
    assert.ok(err instanceof MentorError, `expected MentorError, got ${(err as Error).message}`);
    assert.strictEqual((err as MentorError).status, status, `expected status ${status}: ${(err as Error).message}`);
    return;
  }
  assert.fail(`expected status ${status}, but nothing failed`);
};

async function main(): Promise<void> {
  const stamp = Date.now();
  const emailOf = (label: string): string => `d19test_${label}_${stamp}@example.com`;
  const form = (label: string, extra: Record<string, unknown> = {}): Record<string, unknown> => ({
    name: `d19test_${label}`,
    email: emailOf(label),
    password: 'first-pass-1',
    ...extra,
  });
  const createGoal = async (label: string): Promise<number> =>
    (await query<{ id: number }>('INSERT INTO goals (name) VALUES ($1) RETURNING id', [`d19test_${label}_${stamp}`])).rows[0].id;

  const goalA = await createGoal('goalA');
  const goalB = await createGoal('goalB');

  try {
    console.log('--- Form rules (no database) ---');

    await test('parseNewMentorInput cleans a good form', () => {
      const parsed = parseNewMentorInput({
        name: '  Dana Levi  ',
        email: '  DANA@Example.COM ',
        password: 'long-enough',
        goalIds: [goalA, String(goalB), goalA],
      });
      assert.strictEqual(parsed.name, 'Dana Levi');
      assert.strictEqual(parsed.email, 'dana@example.com');
      assert.deepStrictEqual(parsed.goalIds, [goalA, goalB]); // numbers, no duplicates
    });

    await test('goals are optional', () => {
      assert.deepStrictEqual(parseNewMentorInput(form('nogoals')).goalIds, []);
    });

    await test('a missing name, a bad email and a short password are refused (400)', async () => {
      await rejectsWith(400, () => parseNewMentorInput(form('x', { name: '   ' })));
      await rejectsWith(400, () => parseNewMentorInput(form('x', { name: 'n'.repeat(101) })));
      await rejectsWith(400, () => parseNewMentorInput(form('x', { email: 'not-an-email' })));
      await rejectsWith(400, () => parseNewMentorInput(form('x', { password: '1234567' })));
      await rejectsWith(400, () => parseNewMentorInput(form('x', { password: 'p'.repeat(73) })));
      await rejectsWith(400, () => parseNewMentorInput(null));
      await rejectsWith(400, () => parseNewMentorInput({}));
    });

    await test('bad goal lists are refused (400)', async () => {
      await rejectsWith(400, () => parseNewMentorInput(form('x', { goalIds: 'all' })));
      await rejectsWith(400, () => parseNewMentorInput(form('x', { goalIds: [0] })));
      await rejectsWith(400, () => parseNewMentorInput(form('x', { goalIds: ['abc'] })));
      await rejectsWith(400, () => parseNewMentorInput(form('x', { goalIds: Array.from({ length: 21 }, (_, i) => i + 1) })));
    });

    console.log('\n--- Creating the account ---');

    await test('creates a user with the role MENTOR and a working password hash', async () => {
      const mentor = await createMentorAccount(parseNewMentorInput(form('plain')));
      assert.strictEqual(mentor.email, emailOf('plain'));
      assert.deepStrictEqual(mentor.goals, []);

      const stored = await query<{ role: string; password_hash: string; name: string }>(
        'SELECT role, password_hash, name FROM users WHERE id = $1',
        [mentor.id]
      );
      assert.strictEqual(stored.rows[0].role, 'MENTOR');
      assert.strictEqual(stored.rows[0].name, 'd19test_plain');
      assert.notStrictEqual(stored.rows[0].password_hash, 'first-pass-1'); // never stored as plain text
      assert.ok(await bcrypt.compare('first-pass-1', stored.rows[0].password_hash));
    });

    await test('the new mentor starts with the chosen goals and shows up in listMentors', async () => {
      const mentor = await createMentorAccount(parseNewMentorInput(form('withgoals', { goalIds: [goalA, goalB] })));
      assert.deepStrictEqual(
        mentor.goals.map((goal) => goal.id).sort((a, b) => a - b),
        [goalA, goalB].sort((a, b) => a - b)
      );
      const links = await query('SELECT 1 FROM goal_mentors WHERE mentor_id = $1', [mentor.id]);
      assert.strictEqual(links.rowCount, 2);

      const listed = (await listMentors()).find((item) => item.id === mentor.id);
      assert.ok(listed, 'the mentor is listed');
      assert.strictEqual(listed.goals.length, 2);
    });

    await test('the email is stored in lower case', async () => {
      const mentor = await createMentorAccount(
        parseNewMentorInput(form('upper', { email: emailOf('upper').toUpperCase() }))
      );
      assert.strictEqual(mentor.email, emailOf('upper'));
    });

    console.log('\n--- Failures leave nothing behind ---');

    await test('an email that already exists is refused (409) and nothing changes', async () => {
      await rejectsWith(409, () => createMentorAccount(parseNewMentorInput(form('plain'))));
      const count = await query('SELECT 1 FROM users WHERE email = $1', [emailOf('plain')]);
      assert.strictEqual(count.rowCount, 1);
    });

    await test('an existing learner cannot be turned into a mentor this way (409)', async () => {
      await query(`INSERT INTO users (name, email, password_hash) VALUES ('d19test_learner', $1, 'x')`, [emailOf('learner')]);
      await rejectsWith(409, () => createMentorAccount(parseNewMentorInput(form('learner'))));
      const role = await query<{ role: string }>('SELECT role FROM users WHERE email = $1', [emailOf('learner')]);
      assert.strictEqual(role.rows[0].role, 'USER');
    });

    await test('an unknown goal is refused (404) and no account is created', async () => {
      await rejectsWith(404, () => createMentorAccount(parseNewMentorInput(form('badgoal', { goalIds: [goalA, 999999999] }))));
      const count = await query('SELECT 1 FROM users WHERE email = $1', [emailOf('badgoal')]);
      assert.strictEqual(count.rowCount, 0);
    });
  } finally {
    await query(`DELETE FROM users WHERE email LIKE $1`, [`d19test_%_${stamp}@example.com`]);
    await query(`DELETE FROM goals WHERE name LIKE $1`, [`d19test_%_${stamp}`]);
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