/**
 * Tests for the mentors feature (src/services/mentorService.ts) against PostgreSQL:
 * the MENTOR role, assigning mentors to goals, what a learner can see and the cleanup rules.
 * It builds its own fixture (every name starts with "d17test_") and removes it at the end,
 * so it does not touch the seeded content.
 * Run after `npm run migrate`, from the backend folder:
 *   npx ts-node --transpile-only src/tests/mentors.test.ts
 */
import assert from 'node:assert';
import { pool, query } from '../config/db';
import {
  MentorError,
  assignMentor,
  clearMentorAssignments,
  getMyMentors,
  listMentors,
  removeMentor,
  setUserRole,
} from '../services/mentorService';

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
const rejectsWith = async (status: number, work: () => Promise<unknown>): Promise<void> => {
  try {
    await work();
  } catch (err) {
    assert.ok(err instanceof MentorError, `expected MentorError, got ${(err as Error).message}`);
    assert.strictEqual((err as MentorError).status, status, `expected status ${status}: ${(err as Error).message}`);
    return;
  }
  assert.fail(`expected status ${status}, but nothing failed`);
};

/** The database must refuse the statement with exactly this SQLSTATE */
const refusedByDb = async (code: string, work: () => Promise<unknown>): Promise<void> => {
  try {
    await work();
  } catch (err) {
    assert.strictEqual((err as { code?: string }).code, code, `expected SQLSTATE ${code}: ${(err as Error).message}`);
    return;
  }
  assert.fail(`expected SQLSTATE ${code}, but nothing failed`);
};

async function main(): Promise<void> {
  const stamp = Date.now();
  const createUser = async (label: string, role = 'USER'): Promise<string> =>
    (
      await query<{ id: string }>(
        `INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, 'x', $3) RETURNING id`,
        [`d17test_${label}`, `d17test_${label}_${stamp}@example.com`, role]
      )
    ).rows[0].id;
  const createGoal = async (label: string): Promise<number> =>
    (await query<{ id: number }>('INSERT INTO goals (name) VALUES ($1) RETURNING id', [`d17test_${label}_${stamp}`])).rows[0].id;

  const goalA = await createGoal('goalA');
  const goalB = await createGoal('goalB');
  const mentorOne = await createUser('mentor_one', 'MENTOR');
  const mentorTwo = await createUser('mentor_two', 'MENTOR');
  const learner = await createUser('learner');

  const myGoalLinks = async (mentorId: string): Promise<number[]> =>
    (await query<{ goal_id: number }>('SELECT goal_id FROM goal_mentors WHERE mentor_id = $1 ORDER BY goal_id', [mentorId])).rows.map(
      (row) => row.goal_id
    );

  try {
    console.log('--- Database ---');

    await test('the user_role enum accepts MENTOR and still refuses other values', async () => {
      const spare = await createUser('enum_check', 'MENTOR');
      const role = await query<{ role: string }>('SELECT role FROM users WHERE id = $1', [spare]);
      assert.strictEqual(role.rows[0].role, 'MENTOR');
      await refusedByDb('22P02', () => query(`UPDATE users SET role = 'TEACHER' WHERE id = $1`, [spare]));
    });

    await test('goal_mentors refuses a duplicate link and unknown goals or users', async () => {
      await query('INSERT INTO goal_mentors (goal_id, mentor_id) VALUES ($1, $2)', [goalA, mentorOne]);
      await refusedByDb('23505', () => query('INSERT INTO goal_mentors (goal_id, mentor_id) VALUES ($1, $2)', [goalA, mentorOne]));
      await refusedByDb('23503', () => query('INSERT INTO goal_mentors (goal_id, mentor_id) VALUES ($1, $2)', [999999999, mentorOne]));
      await refusedByDb('23503', () =>
        query('INSERT INTO goal_mentors (goal_id, mentor_id) VALUES ($1, $2)', [goalA, '00000000-0000-4000-8000-000000000000'])
      );
      await query('DELETE FROM goal_mentors WHERE mentor_id = $1', [mentorOne]);
    });

    console.log('\n--- Assigning mentors ---');

    await test('assignMentor links a mentor to a goal, a second call changes nothing', async () => {
      assert.strictEqual(await assignMentor(goalA, mentorOne), true);
      assert.strictEqual(await assignMentor(goalA, mentorOne), false);
      assert.deepStrictEqual(await myGoalLinks(mentorOne), [goalA]);
    });

    await test('only a user with the role MENTOR can be assigned (400)', async () => {
      await rejectsWith(400, () => assignMentor(goalA, learner));
      assert.deepStrictEqual(await myGoalLinks(learner), []);
    });

    await test('an unknown goal or an unknown user gives 404', async () => {
      await rejectsWith(404, () => assignMentor(999999999, mentorOne));
      await rejectsWith(404, () => assignMentor(goalA, '00000000-0000-4000-8000-000000000000'));
    });

    await test('a goal can have several mentors and a mentor can have several goals', async () => {
      await assignMentor(goalA, mentorTwo);
      await assignMentor(goalB, mentorOne);
      assert.deepStrictEqual(await myGoalLinks(mentorOne), [goalA, goalB].sort((a, b) => a - b));
      assert.deepStrictEqual(await myGoalLinks(mentorTwo), [goalA]);
    });

    await test('listMentors shows every mentor with their goals and never a plain user', async () => {
      const mentors = await listMentors();
      const one = mentors.find((mentor) => mentor.id === mentorOne);
      const two = mentors.find((mentor) => mentor.id === mentorTwo);
      assert.ok(one && two, 'both mentors are listed');
      assert.deepStrictEqual(one.goals.map((goal) => goal.id), [goalA, goalB].sort((a, b) => a - b));
      assert.deepStrictEqual(two.goals.map((goal) => goal.id), [goalA]);
      assert.ok(!mentors.some((mentor) => mentor.id === learner), 'a learner is not a mentor');
    });

    await test('a mentor without a goal is still listed', async () => {
      const idle = await createUser('mentor_idle', 'MENTOR');
      const found = (await listMentors()).find((mentor) => mentor.id === idle);
      assert.ok(found);
      assert.deepStrictEqual(found.goals, []);
    });

    console.log('\n--- What a learner sees ---');

    await test('getMyMentors needs a current goal (400)', async () => {
      await rejectsWith(400, () => getMyMentors(learner));
    });

    await test('getMyMentors returns the mentors of the current goal, names only', async () => {
      await query('INSERT INTO user_goals (user_id, goal_id, is_current) VALUES ($1, $2, TRUE)', [learner, goalA]);
      const view = await getMyMentors(learner);
      assert.strictEqual(view.goal.id, goalA);
      assert.deepStrictEqual(view.mentors.map((mentor) => mentor.id).sort(), [mentorOne, mentorTwo].sort());
      assert.deepStrictEqual(Object.keys(view.mentors[0]).sort(), ['id', 'name'], 'no email is exposed');
    });

    await test('a goal without mentors gives an empty list', async () => {
      const lonely = await createGoal('goalLonely');
      await query('UPDATE user_goals SET is_current = FALSE WHERE user_id = $1', [learner]);
      await query('INSERT INTO user_goals (user_id, goal_id, is_current) VALUES ($1, $2, TRUE)', [learner, lonely]);
      assert.deepStrictEqual((await getMyMentors(learner)).mentors, []);
      await query('DELETE FROM user_goals WHERE user_id = $1 AND goal_id = $2', [learner, lonely]);
      await query('UPDATE user_goals SET is_current = TRUE WHERE user_id = $1 AND goal_id = $2', [learner, goalA]);
      await query('DELETE FROM goals WHERE id = $1', [lonely]);
    });

    console.log('\n--- Removing mentors ---');

    await test('removeMentor unlinks the mentor from one goal and keeps the account', async () => {
      await removeMentor(goalB, mentorOne);
      assert.deepStrictEqual(await myGoalLinks(mentorOne), [goalA]);
      assert.strictEqual((await query('SELECT 1 FROM users WHERE id = $1', [mentorOne])).rowCount, 1);
      await rejectsWith(404, () => removeMentor(goalB, mentorOne));
    });

    await test('a user who stops being a mentor loses every goal', async () => {
      const changed = await setUserRole(mentorTwo, 'USER');
      assert.strictEqual(changed?.role, 'USER');
      assert.deepStrictEqual(await myGoalLinks(mentorTwo), []);
      assert.ok(!(await listMentors()).some((mentor) => mentor.id === mentorTwo));
      const view = await getMyMentors(learner);
      assert.deepStrictEqual(view.mentors.map((mentor) => mentor.id), [mentorOne]);
    });

    await test('setUserRole keeps the goals when the role stays MENTOR and returns null for an unknown user', async () => {
      const same = await setUserRole(mentorOne, 'MENTOR');
      assert.strictEqual(same?.role, 'MENTOR');
      assert.deepStrictEqual(await myGoalLinks(mentorOne), [goalA]);
      assert.strictEqual(await setUserRole('00000000-0000-4000-8000-000000000000', 'USER'), null);
    });

    await test('clearMentorAssignments only touches that mentor', async () => {
      await setUserRole(mentorTwo, 'MENTOR');
      await assignMentor(goalA, mentorTwo);
      await clearMentorAssignments(mentorTwo);
      assert.deepStrictEqual(await myGoalLinks(mentorTwo), []);
      assert.deepStrictEqual(await myGoalLinks(mentorOne), [goalA]);
    });

    console.log('\n--- Deleting data ---');

    await test('deleting a goal removes its mentor links but keeps the mentor', async () => {
      const temp = await createGoal('goalTemp');
      await assignMentor(temp, mentorOne);
      await query('DELETE FROM goals WHERE id = $1', [temp]);
      assert.deepStrictEqual(await myGoalLinks(mentorOne), [goalA]);
      assert.strictEqual((await query('SELECT 1 FROM users WHERE id = $1', [mentorOne])).rowCount, 1);
    });

    await test('deleting a mentor account removes their links but keeps the goal', async () => {
      const temp = await createUser('mentor_temp', 'MENTOR');
      await assignMentor(goalA, temp);
      await query('DELETE FROM users WHERE id = $1', [temp]);
      assert.strictEqual((await query('SELECT 1 FROM goal_mentors WHERE mentor_id = $1', [temp])).rowCount, 0);
      assert.strictEqual((await query('SELECT 1 FROM goals WHERE id = $1', [goalA])).rowCount, 1);
    });
  } finally {
    await query(`DELETE FROM users WHERE email LIKE $1`, [`d17test_%_${stamp}@example.com`]);
    await query(`DELETE FROM goals WHERE name LIKE $1`, [`d17test_%_${stamp}`]);
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