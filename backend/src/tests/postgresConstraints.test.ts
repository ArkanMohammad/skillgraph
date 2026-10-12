/**
 * PostgreSQL tests: constraints (foreign key, unique, check), cascade deletes and the key joins.
 * It builds its own small fixture (every name starts with "d12test_") and removes it at the end,
 * so it does not need the seed and does not touch other data.
 * Run after `npm run migrate`, from the backend folder:
 *   npx ts-node --transpile-only src/tests/postgresConstraints.test.ts
 *
 * PostgreSQL error codes used below:
 *   23505 unique violation, 23503 foreign key violation, 23514 check violation, 22P02 invalid enum value
 */
import assert from 'node:assert';
import { pool, query } from '../config/db';
import { loadGoalGraphData } from '../services/recommendationService';
import { progressForAllGoals } from '../services/progressService';
import { summarizeProgress } from '../services/algorithm/progressSummary';

const UNIQUE = '23505';
const FOREIGN_KEY = '23503';
const CHECK = '23514';
const INVALID_ENUM = '22P02';

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

/** The statement must fail with exactly this PostgreSQL error code */
const rejectsWith = async (code: string, statement: () => Promise<unknown>): Promise<void> => {
  try {
    await statement();
  } catch (err) {
    assert.strictEqual((err as { code?: string }).code, code, `expected error ${code}, got ${(err as Error).message}`);
    return;
  }
  assert.fail(`expected PostgreSQL error ${code}, but the statement succeeded`);
};

const count = async (sql: string, params: unknown[] = []): Promise<number> =>
  Number((await query<{ total: string }>(sql, params)).rows[0].total);

async function main(): Promise<void> {
  const stamp = Date.now();
  const emailA = `d12test_a_${stamp}@example.com`;
  const emailB = `d12test_b_${stamp}@example.com`;

  const userA = (
    await query<{ id: string }>(
      `INSERT INTO users (name, email, password_hash) VALUES ('Test A', $1, 'x') RETURNING id`,
      [emailA]
    )
  ).rows[0].id;
  const userB = (
    await query<{ id: string }>(
      `INSERT INTO users (name, email, password_hash) VALUES ('Test B', $1, 'x') RETURNING id`,
      [emailB]
    )
  ).rows[0].id;

  const goalOne = (
    await query<{ id: number }>(`INSERT INTO goals (name) VALUES ($1) RETURNING id`, [`d12test_goal_one_${stamp}`])
  ).rows[0].id;
  const goalTwo = (
    await query<{ id: number }>(`INSERT INTO goals (name) VALUES ($1) RETURNING id`, [`d12test_goal_two_${stamp}`])
  ).rows[0].id;

  const makeSkill = async (name: string, category: string): Promise<number> =>
    (
      await query<{ id: number }>(`INSERT INTO skills (name, category) VALUES ($1, $2) RETURNING id`, [
        `d12test_${name}_${stamp}`,
        category,
      ])
    ).rows[0].id;

  const html = await makeSkill('html', 'Frontend');
  const css = await makeSkill('css', 'Frontend');
  const sql = await makeSkill('sql', 'Backend');

  // Goal one: html -> css. Goal two: html -> sql (html is shared)
  const link = (goal: number, skill: number, required: number, importance: number, hours: number) =>
    query(
      `INSERT INTO goal_skills (goal_id, skill_id, required_proficiency, importance, estimated_hours)
       VALUES ($1, $2, $3, $4, $5)`,
      [goal, skill, required, importance, hours]
    );
  await link(goalOne, html, 0.8, 1, 10);
  await link(goalOne, css, 0.8, 1, 20);
  await link(goalTwo, html, 0.8, 1, 10);
  await link(goalTwo, sql, 0.8, 1, 40);
  await query(`INSERT INTO skill_dependencies (skill_id, prerequisite_skill_id) VALUES ($1, $2), ($3, $2)`, [
    css,
    html,
    sql,
  ]);

  await query(`INSERT INTO user_goals (user_id, goal_id, is_current) VALUES ($1, $2, TRUE)`, [userA, goalOne]);
  await query(
    `INSERT INTO user_skills (user_id, skill_id, proficiency_level, confidence, state) VALUES ($1, $2, 0.9, 0.9, 'MASTERED')`,
    [userA, html]
  );

  try {
    // ---------- UNIQUE ----------
    await test('unique: two accounts cannot share an email', async () => {
      await rejectsWith(UNIQUE, () =>
        query(`INSERT INTO users (name, email, password_hash) VALUES ('Copy', $1, 'x')`, [emailA])
      );
    });

    await test('unique: goal names and skill names cannot repeat', async () => {
      await rejectsWith(UNIQUE, () => query(`INSERT INTO goals (name) VALUES ($1)`, [`d12test_goal_one_${stamp}`]));
      await rejectsWith(UNIQUE, () => query(`INSERT INTO skills (name) VALUES ($1)`, [`d12test_html_${stamp}`]));
    });

    await test('unique: a user cannot have the same goal or the same skill row twice', async () => {
      await rejectsWith(UNIQUE, () =>
        query(`INSERT INTO user_goals (user_id, goal_id, is_current) VALUES ($1, $2, FALSE)`, [userA, goalOne])
      );
      await rejectsWith(UNIQUE, () =>
        query(`INSERT INTO user_skills (user_id, skill_id) VALUES ($1, $2)`, [userA, html])
      );
    });

    await test('unique: only one current goal per user (partial unique index)', async () => {
      await rejectsWith(UNIQUE, () =>
        query(`INSERT INTO user_goals (user_id, goal_id, is_current) VALUES ($1, $2, TRUE)`, [userA, goalTwo])
      );
      // A second goal is fine as long as it is not current
      await query(`INSERT INTO user_goals (user_id, goal_id, is_current) VALUES ($1, $2, FALSE)`, [userA, goalTwo]);
      await query(`DELETE FROM user_goals WHERE user_id = $1 AND goal_id = $2`, [userA, goalTwo]);
    });

    await test('unique: a goal-skill link and a dependency cannot be repeated', async () => {
      await rejectsWith(UNIQUE, () => link(goalOne, html, 0.5, 0.5, 1));
      await rejectsWith(UNIQUE, () =>
        query(`INSERT INTO skill_dependencies (skill_id, prerequisite_skill_id) VALUES ($1, $2)`, [css, html])
      );
    });

    // ---------- FOREIGN KEY ----------
    await test('foreign key: invalid goal, skill, user and prerequisite are rejected', async () => {
      await rejectsWith(FOREIGN_KEY, () =>
        query(`INSERT INTO user_goals (user_id, goal_id, is_current) VALUES ($1, 999999, FALSE)`, [userB])
      );
      await rejectsWith(FOREIGN_KEY, () =>
        query(`INSERT INTO user_skills (user_id, skill_id, proficiency_level) VALUES ($1, 999999, 0.5)`, [userB])
      );
      await rejectsWith(FOREIGN_KEY, () =>
        query(
          `INSERT INTO user_skills (user_id, skill_id) VALUES ('00000000-0000-4000-8000-000000000000', $1)`,
          [html]
        )
      );
      await rejectsWith(FOREIGN_KEY, () =>
        query(`INSERT INTO skill_dependencies (skill_id, prerequisite_skill_id) VALUES ($1, 999999)`, [sql])
      );
      await rejectsWith(FOREIGN_KEY, () => link(999999, html, 0.5, 0.5, 1));
      await rejectsWith(FOREIGN_KEY, () => link(goalOne, 999999, 0.5, 0.5, 1));
    });

    await test('foreign key: an assessment answer needs a real assessment, question and option', async () => {
      await rejectsWith(FOREIGN_KEY, () =>
        query(`INSERT INTO assessments (user_id, skill_id) VALUES ($1, 999999)`, [userA])
      );
      await rejectsWith(FOREIGN_KEY, () =>
        query(
          `INSERT INTO assessment_answers (assessment_id, question_id, selected_option_id, is_correct)
           VALUES (999999, 999999, 999999, TRUE)`
        )
      );
    });

    // ---------- CHECK ----------
    await test('check: mastery and confidence stay between 0 and 1', async () => {
      await rejectsWith(CHECK, () =>
        query(`INSERT INTO user_skills (user_id, skill_id, proficiency_level) VALUES ($1, $2, 1.5)`, [userB, css])
      );
      await rejectsWith(CHECK, () =>
        query(`INSERT INTO user_skills (user_id, skill_id, proficiency_level) VALUES ($1, $2, -0.1)`, [userB, css])
      );
      await rejectsWith(CHECK, () =>
        query(`INSERT INTO user_skills (user_id, skill_id, confidence) VALUES ($1, $2, 1.2)`, [userB, css])
      );
    });

    await test('check: required mastery and importance stay between 0 and 1, hours are not negative', async () => {
      await rejectsWith(CHECK, () => link(goalTwo, css, 1.5, 0.5, 1));
      await rejectsWith(CHECK, () => link(goalTwo, css, 0.5, -0.2, 1));
      await rejectsWith(CHECK, () => link(goalTwo, css, 0.5, 0.5, -5));
    });

    await test('check: a skill cannot be its own prerequisite', async () => {
      await rejectsWith(CHECK, () =>
        query(`INSERT INTO skill_dependencies (skill_id, prerequisite_skill_id) VALUES ($1, $1)`, [sql])
      );
    });

    await test('check: assessment score 0-100, question difficulty 1-3', async () => {
      await rejectsWith(CHECK, () =>
        query(`INSERT INTO assessments (user_id, skill_id, final_score) VALUES ($1, $2, 101)`, [userA, html])
      );
      await rejectsWith(CHECK, () =>
        query(`INSERT INTO questions (skill_id, difficulty, prompt) VALUES ($1, 4, $2)`, [html, `d12test_q_${stamp}`])
      );
    });

    await test('check: weekly hours stay between 1 and 80 (needs the 001 migration)', async () => {
      const column = await count(
        `SELECT COUNT(*) AS total FROM information_schema.columns
         WHERE table_name = 'users' AND column_name = 'weekly_hours'`
      );
      assert.ok(column === 1, 'run "npm run migrate" first: users.weekly_hours does not exist');
      await rejectsWith(CHECK, () => query(`UPDATE users SET weekly_hours = 0 WHERE id = $1`, [userA]));
      await rejectsWith(CHECK, () => query(`UPDATE users SET weekly_hours = 81 WHERE id = $1`, [userA]));
      await query(`UPDATE users SET weekly_hours = 12 WHERE id = $1`, [userA]);
    });

    await test('enum: only USER and ADMIN are valid roles, skill states are limited too', async () => {
      await rejectsWith(INVALID_ENUM, () => query(`UPDATE users SET role = 'OWNER' WHERE id = $1`, [userA]));
      await rejectsWith(INVALID_ENUM, () =>
        query(`UPDATE user_skills SET state = 'EXPERT' WHERE user_id = $1`, [userA])
      );
    });

    // ---------- KEY JOINS ----------
    await test('join: goal -> skills -> dependencies returns only the edges inside the goal', async () => {
      const data = await loadGoalGraphData(userA, goalOne);
      assert.ok(data);
      assert.deepStrictEqual(data!.skills.map((s) => s.skillId).sort(), [html, css].sort());
      assert.deepStrictEqual(data!.edges, [{ skillId: css, prerequisiteId: html }]);
    });

    await test('join: progress is loaded per user, a user without progress gets an empty map', async () => {
      const mine = await loadGoalGraphData(userA, goalOne);
      assert.strictEqual(mine!.progress.get(html)?.mastery, 0.9);
      const other = await loadGoalGraphData(userB, goalOne);
      assert.strictEqual(other!.progress.size, 0);
    });

    await test('join: the same user_skills row serves both goals (nothing is copied on a goal change)', async () => {
      const before = await count('SELECT COUNT(*) AS total FROM user_skills WHERE user_id = $1', [userA]);
      const first = await loadGoalGraphData(userA, goalOne);
      const second = await loadGoalGraphData(userA, goalTwo);
      assert.strictEqual(first!.progress.get(html)?.mastery, 0.9);
      assert.strictEqual(second!.progress.get(html)?.mastery, 0.9);
      assert.strictEqual(await count('SELECT COUNT(*) AS total FROM user_skills WHERE user_id = $1', [userA]), before);
    });

    await test('join: the one-query progress for all goals matches the pure summary', async () => {
      const all = await progressForAllGoals(userA);
      for (const goal of [goalOne, goalTwo]) {
        const row = all.find((item) => item.goalId === goal);
        assert.ok(row, `goal ${goal} is missing`);
        const summary = summarizeProgress((await loadGoalGraphData(userA, goal))!);
        assert.strictEqual(row!.percent, summary.percent);
        assert.strictEqual(row!.masteredSkills, summary.masteredSkills);
        assert.strictEqual(row!.totalSkills, summary.totalSkills);
      }
    });

    await test('join: a skill without a user_skills row counts as zero progress (LEFT JOIN)', async () => {
      const row = (await progressForAllGoals(userB)).find((item) => item.goalId === goalOne);
      assert.strictEqual(row?.percent, 0);
      assert.strictEqual(row?.masteredSkills, 0);
    });

    // ---------- CASCADE ----------
    await test('cascade: deleting a skill removes its goal links and dependencies', async () => {
      const extra = await makeSkill('extra', 'Backend');
      await link(goalTwo, extra, 0.7, 0.5, 5);
      await query(`INSERT INTO skill_dependencies (skill_id, prerequisite_skill_id) VALUES ($1, $2)`, [extra, html]);
      await query(`DELETE FROM skills WHERE id = $1`, [extra]);
      assert.strictEqual(await count('SELECT COUNT(*) AS total FROM goal_skills WHERE skill_id = $1', [extra]), 0);
      assert.strictEqual(
        await count('SELECT COUNT(*) AS total FROM skill_dependencies WHERE skill_id = $1', [extra]),
        0
      );
    });

    await test('cascade: deleting a user removes goals, skills, assessments and events', async () => {
      const assessment = (
        await query<{ id: number }>(`INSERT INTO assessments (user_id, skill_id) VALUES ($1, $2) RETURNING id`, [
          userB,
          html,
        ])
      ).rows[0].id;
      await query(`INSERT INTO user_goals (user_id, goal_id, is_current) VALUES ($1, $2, TRUE)`, [userB, goalOne]);
      await query(`INSERT INTO user_skills (user_id, skill_id) VALUES ($1, $2)`, [userB, html]);
      await query(`INSERT INTO skill_events (user_id, skill_id, assessment_id, event_type) VALUES ($1, $2, $3, 'test')`, [
        userB,
        html,
        assessment,
      ]);

      await query('DELETE FROM users WHERE id = $1', [userB]);

      for (const table of ['user_goals', 'user_skills', 'assessments', 'skill_events']) {
        assert.strictEqual(
          await count(`SELECT COUNT(*) AS total FROM ${table} WHERE user_id = $1`, [userB]),
          0,
          `${table} still has rows of the deleted user`
        );
      }
      // The shared data stays
      assert.strictEqual(await count('SELECT COUNT(*) AS total FROM skills WHERE id = $1', [html]), 1);
    });
  } finally {
    // Remove the fixture (children first thanks to the cascades)
    await query('DELETE FROM users WHERE email LIKE $1', ['d12test\\_%']);
    await query(`DELETE FROM goals WHERE name LIKE 'd12test\\_%'`);
    await query(`DELETE FROM skills WHERE name LIKE 'd12test\\_%'`);
    await pool.end();
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});