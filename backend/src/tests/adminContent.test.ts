/**
 * Tests for the admin content management (src/services/adminContentService.ts).
 *  - Part 1 checks the input rules (no database needed).
 *  - Part 2 runs the real service against PostgreSQL. It builds its own fixture (every name starts
 *    with "d15test_") and removes it at the end, so it does not touch the seeded content.
 * Run after `npm run migrate`, from the backend folder:
 *   npx ts-node --transpile-only src/tests/adminContent.test.ts
 */
import assert from 'node:assert';
import { pool, query } from '../config/db';
import { startAssessment } from '../services/assessmentService';
import {
  AdminContentError,
  MIN_ACTIVE_QUESTIONS,
  addSkillToGoal,
  createQuestion,
  createSkill,
  getGoalSkills,
  listQuestions,
  listSkills,
  parseGoalSkillInput,
  parseQuestionInput,
  parseSkillInput,
  removeSkillFromGoal,
  setQuestionActive,
  updateGoalSkill,
  updateQuestion,
  updateSkill,
} from '../services/adminContentService';

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

/** The work must fail with an AdminContentError that has exactly this HTTP status */
const rejectsWith = async (status: number, work: () => unknown): Promise<void> => {
  try {
    await work();
  } catch (err) {
    assert.ok(err instanceof AdminContentError, `expected AdminContentError, got ${(err as Error).message}`);
    assert.strictEqual((err as AdminContentError).status, status, `expected status ${status}: ${(err as Error).message}`);
    return;
  }
  assert.fail(`expected status ${status}, but nothing failed`);
};

const validQuestion = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
  conceptId: 1,
  difficulty: 2,
  prompt: 'What is 2 + 2?',
  options: [
    { text: '4', isCorrect: true },
    { text: '3', isCorrect: false },
    { text: '5', isCorrect: false },
    { text: '22', isCorrect: false },
  ],
  ...overrides,
});

const options = (texts: string[], correctIndexes: number[]) =>
  texts.map((text, index) => ({ text, isCorrect: correctIndexes.includes(index) }));

const defaults = { requiredMastery: 0.7, importance: 0.8, estimatedHours: 10 };

async function partOne(): Promise<void> {
  console.log('--- Part 1: input rules ---');

  await test('a valid question is accepted and the text is cleaned', () => {
    const parsed = parseQuestionInput(validQuestion({ prompt: '  What   is 2 + 2?  ' }));
    assert.strictEqual(parsed.prompt, 'What is 2 + 2?');
    assert.strictEqual(parsed.options.length, 4);
  });

  await test('a question needs exactly 4 options', async () => {
    assert.throws(() => parseQuestionInput(validQuestion({ options: options(['a', 'b', 'c'], [0]) })), /exactly 4/);
    assert.throws(() => parseQuestionInput(validQuestion({ options: options(['a', 'b', 'c', 'd', 'e'], [0]) })), /exactly 4/);
  });

  await test('exactly one option must be correct', () => {
    assert.throws(() => parseQuestionInput(validQuestion({ options: options(['a', 'b', 'c', 'd'], []) })), /Exactly one/);
    assert.throws(() => parseQuestionInput(validQuestion({ options: options(['a', 'b', 'c', 'd'], [0, 1]) })), /Exactly one/);
  });

  await test('options must be different (case does not matter) and not empty', () => {
    assert.throws(() => parseQuestionInput(validQuestion({ options: options(['Yes', 'yes', 'c', 'd'], [0]) })), /different/);
    assert.throws(() => parseQuestionInput(validQuestion({ options: options(['a', '   ', 'c', 'd'], [0]) })), /required/);
  });

  await test('difficulty, prompt and concept are checked', () => {
    assert.throws(() => parseQuestionInput(validQuestion({ difficulty: 4 })), /difficulty/);
    assert.throws(() => parseQuestionInput(validQuestion({ difficulty: 1.5 })), /difficulty/);
    assert.throws(() => parseQuestionInput(validQuestion({ prompt: '   ' })), /prompt is required/);
    assert.throws(() => parseQuestionInput(validQuestion({ prompt: 'x'.repeat(501) })), /at most 500/);
    assert.throws(() => parseQuestionInput(validQuestion({ conceptId: 'abc' })), /conceptId/);
  });

  await test('goal skill values: mastery 0.5-1, importance above 0, whole hours', () => {
    assert.deepStrictEqual(parseGoalSkillInput({ requiredMastery: 0.755, importance: 1, estimatedHours: 12 }), {
      requiredMastery: 0.76,
      importance: 1,
      estimatedHours: 12,
    });
    assert.throws(() => parseGoalSkillInput({ ...defaults, requiredMastery: 0.4 }), /requiredMastery/);
    assert.throws(() => parseGoalSkillInput({ ...defaults, requiredMastery: 1.1 }), /requiredMastery/);
    assert.throws(() => parseGoalSkillInput({ ...defaults, importance: 0 }), /importance/);
    assert.throws(() => parseGoalSkillInput({ ...defaults, estimatedHours: 0 }), /estimatedHours/);
    assert.throws(() => parseGoalSkillInput({ ...defaults, estimatedHours: 2.5 }), /whole/);
    assert.throws(() => parseGoalSkillInput({ ...defaults, estimatedHours: '10' }), /estimatedHours/);
  });

  await test('a skill needs a name and a category', () => {
    assert.throws(() => parseSkillInput({ name: '', category: 'Data' }), /name is required/);
    assert.throws(() => parseSkillInput({ name: 'Rust', category: '' }), /category is required/);
    assert.deepStrictEqual(parseSkillInput({ name: ' Rust ', category: 'Backend' }), {
      name: 'Rust',
      category: 'Backend',
      description: '',
    });
  });
}

async function partTwo(): Promise<void> {
  console.log('\n--- Part 2: PostgreSQL ---');
  const stamp = Date.now();
  const skillName = (label: string): string => `d15test_${label}_${stamp}`;

  const goalId = (
    await query<{ id: number }>(`INSERT INTO goals (name) VALUES ($1) RETURNING id`, [`d15test_goal_${stamp}`])
  ).rows[0].id;
  const otherGoalId = (
    await query<{ id: number }>(`INSERT INTO goals (name) VALUES ($1) RETURNING id`, [`d15test_goal2_${stamp}`])
  ).rows[0].id;
  const userId = (
    await query<{ id: string }>(
      `INSERT INTO users (name, email, password_hash) VALUES ('Test', $1, 'x') RETURNING id`,
      [`d15test_${stamp}@example.com`]
    )
  ).rows[0].id;

  const conceptOf = async (skillId: number): Promise<number> =>
    (await query<{ id: number }>('SELECT id FROM concepts WHERE skill_id = $1', [skillId])).rows[0].id;

  const questionBody = (conceptId: number, prompt: string, correct = 0) =>
    parseQuestionInput({
      conceptId,
      difficulty: 2,
      prompt,
      options: ['one', 'two', 'three', 'four'].map((text, index) => ({ text: `${text} ${prompt}`, isCorrect: index === correct })),
    });

  try {
    let alpha = 0;
    let beta = 0;

    await test('createSkill adds the skill and one "General" concept with weight 1', async () => {
      alpha = (await createSkill(parseSkillInput({ name: skillName('alpha'), category: 'Test' }))).id;
      const concepts = await query<{ name: string; weight: string }>('SELECT name, weight FROM concepts WHERE skill_id = $1', [alpha]);
      assert.deepStrictEqual(concepts.rows.map((c) => [c.name, Number(c.weight)]), [['General', 1]]);
    });

    await test('createSkill refuses a duplicate name with 409', async () => {
      await rejectsWith(409, () => createSkill(parseSkillInput({ name: skillName('alpha'), category: 'Test' })));
    });

    await test('updateSkill edits the fields, 404 for an unknown skill, 409 for a taken name', async () => {
      beta = (await createSkill(parseSkillInput({ name: skillName('beta'), category: 'Test' }))).id;
      await updateSkill(beta, parseSkillInput({ name: skillName('beta'), category: 'Changed', description: 'Hello' }));
      const row = await query<{ category: string; description: string }>('SELECT category, description FROM skills WHERE id = $1', [beta]);
      assert.deepStrictEqual(row.rows[0], { category: 'Changed', description: 'Hello' });
      await rejectsWith(404, () => updateSkill(999999999, parseSkillInput({ name: 'x', category: 'y' })));
      await rejectsWith(409, () => updateSkill(beta, parseSkillInput({ name: skillName('alpha'), category: 'Test' })));
    });

    await test('listSkills shows the new skill with its counts and concept', async () => {
      const found = (await listSkills()).find((skill) => skill.id === alpha);
      assert.ok(found, 'skill is listed');
      assert.strictEqual(found.activeQuestions, 0);
      assert.strictEqual(found.concepts.length, 1);
    });

    await test('createQuestion saves a question with 4 options and one correct answer', async () => {
      const concept = await conceptOf(alpha);
      const created = await createQuestion(alpha, questionBody(concept, 'q1', 2));
      const list = await listQuestions(alpha);
      assert.strictEqual(list.length, 1);
      assert.strictEqual(list[0].id, created.id);
      assert.strictEqual(list[0].options.length, 4);
      assert.strictEqual(list[0].options.filter((o) => o.isCorrect).length, 1);
      assert.ok(list[0].options[2].isCorrect, 'the third option is the right one');
      assert.strictEqual(list[0].isActive, true);
    });

    await test('createQuestion refuses a duplicate text (409), a foreign concept (400), an unknown skill (404)', async () => {
      const concept = await conceptOf(alpha);
      await rejectsWith(409, () => createQuestion(alpha, questionBody(concept, 'q1')));
      const foreignConcept = await conceptOf(beta);
      await rejectsWith(400, () => createQuestion(alpha, questionBody(foreignConcept, 'q-foreign')));
      await rejectsWith(404, () => createQuestion(999999999, questionBody(concept, 'q-nobody')));
    });

    await test('a failed createQuestion leaves nothing behind (transaction)', async () => {
      const concept = await conceptOf(alpha);
      const before = (await listQuestions(alpha)).length;
      await rejectsWith(409, () => createQuestion(alpha, questionBody(concept, 'q1')));
      assert.strictEqual((await listQuestions(alpha)).length, before);
      const orphans = await query<{ total: string }>(
        'SELECT COUNT(*) AS total FROM questions q WHERE NOT EXISTS (SELECT 1 FROM question_options o WHERE o.question_id = q.id)'
      );
      assert.strictEqual(Number(orphans.rows[0].total), 0, 'no question without options');
    });

    await test('a skill with too few active questions cannot be added to a goal (400)', async () => {
      await rejectsWith(400, () => addSkillToGoal(goalId, alpha, parseGoalSkillInput(defaults)));
      const view = await getGoalSkills(goalId);
      const row = view.available.find((skill) => skill.skillId === alpha);
      assert.ok(row && row.canAdd === false, 'listed as available but not addable');
    });

    await test('with enough questions the skill can be added; duplicates, unknown ids are refused', async () => {
      const concept = await conceptOf(alpha);
      for (const label of ['q2', 'q3', 'q4']) await createQuestion(alpha, questionBody(concept, label));
      assert.ok(MIN_ACTIVE_QUESTIONS <= 4);
      await addSkillToGoal(goalId, alpha, parseGoalSkillInput(defaults));
      await rejectsWith(409, () => addSkillToGoal(goalId, alpha, parseGoalSkillInput(defaults)));
      await rejectsWith(404, () => addSkillToGoal(999999999, alpha, parseGoalSkillInput(defaults)));
      await rejectsWith(404, () => addSkillToGoal(goalId, 999999999, parseGoalSkillInput(defaults)));
    });

    await test('getGoalSkills lists the skill inside the goal and no longer as available', async () => {
      const view = await getGoalSkills(goalId);
      assert.strictEqual(view.goal.id, goalId);
      const row = view.skills.find((skill) => skill.skillId === alpha);
      assert.ok(row, 'skill is in the goal');
      assert.deepStrictEqual([row.requiredMastery, row.importance, row.estimatedHours, row.activeQuestions], [0.7, 0.8, 10, 4]);
      assert.ok(!view.available.some((skill) => skill.skillId === alpha));
      await rejectsWith(404, () => getGoalSkills(999999999));
    });

    await test('updateGoalSkill changes the values only inside that goal', async () => {
      await addSkillToGoal(otherGoalId, alpha, parseGoalSkillInput(defaults));
      await updateGoalSkill(goalId, alpha, parseGoalSkillInput({ requiredMastery: 0.9, importance: 0.5, estimatedHours: 25 }));
      const mine = (await getGoalSkills(goalId)).skills.find((s) => s.skillId === alpha)!;
      const other = (await getGoalSkills(otherGoalId)).skills.find((s) => s.skillId === alpha)!;
      assert.deepStrictEqual([mine.requiredMastery, mine.importance, mine.estimatedHours], [0.9, 0.5, 25]);
      assert.deepStrictEqual([other.requiredMastery, other.importance, other.estimatedHours], [0.7, 0.8, 10]);
      await rejectsWith(404, () => updateGoalSkill(goalId, beta, parseGoalSkillInput(defaults)));
    });

    await test('updateQuestion changes the text and the right answer but keeps the option rows', async () => {
      const [first] = await listQuestions(alpha);
      const concept = await conceptOf(alpha);
      await updateQuestion(first.id, questionBody(concept, 'q1 edited', 3));
      const [after] = (await listQuestions(alpha)).filter((q) => q.id === first.id);
      assert.strictEqual(after.prompt, 'q1 edited');
      assert.deepStrictEqual(after.options.map((o) => o.id), first.options.map((o) => o.id), 'same option ids');
      assert.ok(after.options[3].isCorrect && after.options.filter((o) => o.isCorrect).length === 1);
      await rejectsWith(404, () => updateQuestion(999999999, questionBody(concept, 'nope')));
    });

    await test('updateQuestion refuses a text that another question of the skill already uses (409)', async () => {
      const concept = await conceptOf(alpha);
      const list = await listQuestions(alpha);
      await rejectsWith(409, () => updateQuestion(list[1].id, questionBody(concept, 'q1 edited')));
    });

    await test('a question cannot be hidden when the skill would fall below the minimum', async () => {
      const [first] = await listQuestions(alpha);
      await rejectsWith(400, () => setQuestionActive(first.id, false));
      assert.strictEqual((await listQuestions(alpha)).filter((q) => q.isActive).length, 4);
    });

    await test('with a 5th question one can be hidden, and the assessment never asks the hidden one', async () => {
      const concept = await conceptOf(alpha);
      await createQuestion(alpha, questionBody(concept, 'q5'));
      const list = await listQuestions(alpha);
      const hidden = list[0];
      await setQuestionActive(hidden.id, false);
      assert.strictEqual((await listQuestions(alpha)).filter((q) => q.isActive).length, 4);

      const started = await startAssessment(userId, alpha);
      assert.ok(started.question, 'a question is returned');
      assert.notStrictEqual(started.question!.id, hidden.id, 'the hidden question is skipped');
      assert.strictEqual(started.totalQuestions, 4);

      await setQuestionActive(hidden.id, true); // It can be shown again
      assert.strictEqual((await listQuestions(alpha)).filter((q) => q.isActive).length, 5);
      await rejectsWith(404, () => setQuestionActive(999999999, false));
    });

    await test('removeSkillFromGoal keeps the skill and lists the skills that needed it', async () => {
      const concept = await conceptOf(beta);
      for (const label of ['b1', 'b2', 'b3', 'b4']) await createQuestion(beta, questionBody(concept, label));
      await addSkillToGoal(goalId, beta, parseGoalSkillInput(defaults));
      await query('INSERT INTO skill_dependencies (skill_id, prerequisite_skill_id) VALUES ($1, $2)', [beta, alpha]);

      const view = await getGoalSkills(goalId);
      assert.deepStrictEqual(view.skills.find((s) => s.skillId === beta)!.prerequisiteIds, [alpha]);

      const removed = await removeSkillFromGoal(goalId, alpha);
      assert.deepStrictEqual(removed.affectedSkills, [skillName('beta')]);
      assert.ok(!(await getGoalSkills(goalId)).skills.some((s) => s.skillId === alpha), 'alpha left the goal');
      assert.strictEqual((await query('SELECT 1 FROM skills WHERE id = $1', [alpha])).rowCount, 1, 'alpha still exists');
      assert.strictEqual((await getGoalSkills(otherGoalId)).skills.some((s) => s.skillId === alpha), true, 'other goal untouched');
    });

    await test('the last skill of a goal cannot be removed (400), a non-member gives 404', async () => {
      await rejectsWith(400, () => removeSkillFromGoal(goalId, beta));
      await rejectsWith(404, () => removeSkillFromGoal(goalId, alpha));
    });

    await test('progress of a user stays when the skill leaves a goal', async () => {
      await query('INSERT INTO user_skills (user_id, skill_id, proficiency_level, confidence) VALUES ($1, $2, 0.8, 0.9)', [userId, alpha]);
      await addSkillToGoal(goalId, alpha, parseGoalSkillInput(defaults));
      await removeSkillFromGoal(goalId, alpha);
      const kept = await query<{ mastery: string }>('SELECT proficiency_level AS mastery FROM user_skills WHERE user_id = $1 AND skill_id = $2', [userId, alpha]);
      assert.strictEqual(Number(kept.rows[0].mastery), 0.8);
    });
  } finally {
    // Remove the fixture (skills cascade to concepts, questions, options and goal links)
    await query(`DELETE FROM assessments WHERE user_id = $1`, [userId]);
    await query(`DELETE FROM users WHERE id = $1`, [userId]);
    await query(`DELETE FROM skills WHERE name LIKE $1`, [`d15test_%_${stamp}`]);
    await query(`DELETE FROM goals WHERE id = $1 OR id = $2`, [goalId, otherGoalId]);
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