/**
 * Tests for the admin content management (src/services/adminContentService.ts).
 *  - Part 1 checks the input rules (no database needed).
 *  - Part 2 runs the real service against PostgreSQL: skills, questions and the skills of a goal.
 *  - Part 3 runs the prerequisite editing against PostgreSQL (cycles, shared links, links outside the goal).
 * Parts 2 and 3 build their own fixture (every name starts with "d15test_") and remove it at the end,
 * so they do not touch the seeded content.
 * Run after `npm run migrate`, from the backend folder:
 *   npx ts-node --transpile-only src/tests/adminContent.test.ts
 */
import assert from 'node:assert';
import { pool, query } from '../config/db';
import { startAssessment } from '../services/assessmentService';
import { QUESTIONS_PER_ASSESSMENT } from '../services/algorithm/adaptiveService';
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
  parsePrerequisiteInput,
  parseQuestionInput,
  parseSkillInput,
  removeSkillFromGoal,
  setQuestionActive,
  setSkillPrerequisites,
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

  await test('prerequisite input: a list of different ids is accepted', () => {
    assert.deepStrictEqual(parsePrerequisiteInput({ prerequisiteIds: [3, 5] }).prerequisiteIds, [3, 5]);
    assert.deepStrictEqual(parsePrerequisiteInput({ prerequisiteIds: [] }).prerequisiteIds, []);
  });

  await test('prerequisite input: not a list, a repeated id, a bad id or too many are refused (400)', async () => {
    await rejectsWith(400, () => parsePrerequisiteInput({}));
    await rejectsWith(400, () => parsePrerequisiteInput({ prerequisiteIds: '3' }));
    await rejectsWith(400, () => parsePrerequisiteInput({ prerequisiteIds: [3, 3] }));
    await rejectsWith(400, () => parsePrerequisiteInput({ prerequisiteIds: [0] }));
    await rejectsWith(400, () => parsePrerequisiteInput({ prerequisiteIds: [1.5] }));
    await rejectsWith(400, () => parsePrerequisiteInput({ prerequisiteIds: Array.from({ length: 21 }, (_, i) => i + 1) }));
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
      // q1 exists already: add the others until the skill has exactly the minimum
      for (let n = 2; n <= MIN_ACTIVE_QUESTIONS; n += 1) await createQuestion(alpha, questionBody(concept, `q${n}`));
      assert.strictEqual(MIN_ACTIVE_QUESTIONS, QUESTIONS_PER_ASSESSMENT);
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
      assert.deepStrictEqual([row.requiredMastery, row.importance, row.estimatedHours, row.activeQuestions], [0.7, 0.8, 10, MIN_ACTIVE_QUESTIONS]);
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
      assert.strictEqual((await listQuestions(alpha)).filter((q) => q.isActive).length, MIN_ACTIVE_QUESTIONS);
    });

    await test('with one more question one can be hidden, and the assessment never asks the hidden one', async () => {
      const concept = await conceptOf(alpha);
      await createQuestion(alpha, questionBody(concept, `q${MIN_ACTIVE_QUESTIONS + 1}`));
      const list = await listQuestions(alpha);
      const hidden = list[0];
      await setQuestionActive(hidden.id, false);
      assert.strictEqual((await listQuestions(alpha)).filter((q) => q.isActive).length, MIN_ACTIVE_QUESTIONS);

      const started = await startAssessment(userId, alpha);
      assert.ok(started.question, 'a question is returned');
      assert.notStrictEqual(started.question!.id, hidden.id, 'the hidden question is skipped');
      assert.strictEqual(started.totalQuestions, MIN_ACTIVE_QUESTIONS);

      await setQuestionActive(hidden.id, true); // It can be shown again
      assert.strictEqual((await listQuestions(alpha)).filter((q) => q.isActive).length, MIN_ACTIVE_QUESTIONS + 1);
      await rejectsWith(404, () => setQuestionActive(999999999, false));
    });

    await test('removeSkillFromGoal keeps the skill and lists the skills that needed it', async () => {
      const concept = await conceptOf(beta);
      for (let n = 1; n <= MIN_ACTIVE_QUESTIONS; n += 1) await createQuestion(beta, questionBody(concept, `b${n}`));
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

async function partThree(): Promise<void> {
  console.log('\n--- Part 3: prerequisites ---');
  const stamp = Date.now();
  const skillName = (label: string): string => `d15test_p${label}_${stamp}`;
  const goalName = (label: string): string => `d15test_pgoal${label}_${stamp}`;

  const makeGoal = async (label: string): Promise<number> =>
    (await query<{ id: number }>('INSERT INTO goals (name) VALUES ($1) RETURNING id', [goalName(label)])).rows[0].id;

  // A skill with the minimum number of questions, so it can be part of a goal
  const makeSkill = async (label: string): Promise<number> => {
    const id = (await createSkill(parseSkillInput({ name: skillName(label), category: 'Test' }))).id;
    const concept = (await query<{ id: number }>('SELECT id FROM concepts WHERE skill_id = $1', [id])).rows[0].id;
    for (let n = 1; n <= MIN_ACTIVE_QUESTIONS; n += 1) {
      await createQuestion(
        id,
        parseQuestionInput({
          conceptId: concept,
          difficulty: 2,
          prompt: `${label} question ${n}`,
          options: ['one', 'two', 'three', 'four'].map((text, index) => ({ text: `${text} ${label} ${n}`, isCorrect: index === 0 })),
        })
      );
    }
    return id;
  };

  const goalOne = await makeGoal('1');
  const goalTwo = await makeGoal('2');
  const [a, b, c, d, e] = [
    await makeSkill('a'),
    await makeSkill('b'),
    await makeSkill('c'),
    await makeSkill('d'),
    await makeSkill('e'),
  ];

  const prerequisitesOf = async (goalId: number, skillId: number): Promise<number[]> =>
    (await getGoalSkills(goalId)).skills.find((row) => row.skillId === skillId)!.prerequisiteIds.sort((x, y) => x - y);

  const input = (ids: number[]) => parsePrerequisiteInput({ prerequisiteIds: ids });

  try {
    // Goal one has a, b, c, d. Goal two has a, b and e. Skill e is not part of goal one.
    for (const id of [a, b, c, d]) await addSkillToGoal(goalOne, id, parseGoalSkillInput(defaults));
    for (const id of [a, b, e]) await addSkillToGoal(goalTwo, id, parseGoalSkillInput(defaults));

    await test('setSkillPrerequisites adds a prerequisite and the goal view shows it', async () => {
      const change = await setSkillPrerequisites(goalOne, b, input([a]));
      assert.deepStrictEqual(change.added, [skillName('a')]);
      assert.deepStrictEqual(change.removed, []);
      assert.deepStrictEqual(await prerequisitesOf(goalOne, b), [a]);
    });

    await test('the answer lists the other goals that contain both skills', async () => {
      const change = await setSkillPrerequisites(goalOne, b, input([]));
      assert.deepStrictEqual(change.removed, [skillName('a')]);
      assert.deepStrictEqual(change.alsoAffectedGoals, [goalName('2')]);
      const back = await setSkillPrerequisites(goalOne, b, input([a]));
      assert.deepStrictEqual(back.alsoAffectedGoals, [goalName('2')]);
      // Goal two sees the same link, because the link is shared
      assert.deepStrictEqual(await prerequisitesOf(goalTwo, b), [a]);
    });

    await test('a link between skills that no other goal contains reports no other goal', async () => {
      const change = await setSkillPrerequisites(goalOne, c, input([a, b]));
      assert.deepStrictEqual(change.added, [skillName('a'), skillName('b')]);
      assert.deepStrictEqual(change.alsoAffectedGoals, []); // a and b are in goal two, but c is not
    });

    await test('replacing the list adds and removes in one call', async () => {
      const change = await setSkillPrerequisites(goalOne, c, input([b, d]));
      assert.deepStrictEqual(change.added, [skillName('d')]);
      assert.deepStrictEqual(change.removed, [skillName('a')]);
      assert.deepStrictEqual(await prerequisitesOf(goalOne, c), [b, d].sort((x, y) => x - y));
    });

    await test('saving the same list again changes nothing', async () => {
      const change = await setSkillPrerequisites(goalOne, c, input([b, d]));
      assert.deepStrictEqual(change, { added: [], removed: [], alsoAffectedGoals: [] });
    });

    await test('a direct cycle is refused (400) and nothing changes', async () => {
      // b needs a, so a cannot need b
      await rejectsWith(400, () => setSkillPrerequisites(goalOne, a, input([b])));
      assert.deepStrictEqual(await prerequisitesOf(goalOne, a), []);
    });

    await test('an indirect cycle is refused (400)', async () => {
      // c needs b, b needs a, so a cannot need c
      await rejectsWith(400, () => setSkillPrerequisites(goalOne, a, input([c])));
      assert.deepStrictEqual(await prerequisitesOf(goalOne, a), []);
    });

    await test('a skill cannot be its own prerequisite (400)', async () => {
      await rejectsWith(400, () => setSkillPrerequisites(goalOne, a, input([a])));
    });

    await test('a prerequisite from outside the goal is refused (400), a skill outside the goal gives 404', async () => {
      await rejectsWith(400, () => setSkillPrerequisites(goalOne, a, input([e])));
      await rejectsWith(404, () => setSkillPrerequisites(goalOne, e, input([a])));
      await rejectsWith(404, () => setSkillPrerequisites(999999999, a, input([])));
    });

    await test('a prerequisite that is not part of this goal is left untouched', async () => {
      // d needs e through goal two. In goal one e does not exist, so goal one must not remove that link.
      await query('INSERT INTO skill_dependencies (skill_id, prerequisite_skill_id) VALUES ($1, $2)', [d, e]);
      await setSkillPrerequisites(goalOne, d, input([a]));
      const rows = await query<{ prerequisite_skill_id: number }>(
        'SELECT prerequisite_skill_id FROM skill_dependencies WHERE skill_id = $1 ORDER BY prerequisite_skill_id',
        [d]
      );
      assert.deepStrictEqual(rows.rows.map((r) => r.prerequisite_skill_id), [a, e].sort((x, y) => x - y));
      await setSkillPrerequisites(goalOne, d, input([]));
      const after = await query('SELECT 1 FROM skill_dependencies WHERE skill_id = $1 AND prerequisite_skill_id = $2', [d, e]);
      assert.strictEqual(after.rowCount, 1, 'the link to e is still there');
    });

    await test('a cycle through a skill of another goal is also refused', async () => {
      // d needs e (kept above). e needing d would close a cycle, even though goal one does not contain e.
      await addSkillToGoal(goalTwo, d, parseGoalSkillInput(defaults));
      await rejectsWith(400, () => setSkillPrerequisites(goalTwo, e, input([d])));
    });

    await test('an empty list removes every prerequisite inside the goal', async () => {
      await setSkillPrerequisites(goalOne, c, input([]));
      assert.deepStrictEqual(await prerequisitesOf(goalOne, c), []);
    });
  } finally {
    await query('DELETE FROM skills WHERE name LIKE $1', [`d15test_p%_${stamp}`]);
    await query('DELETE FROM goals WHERE id = $1 OR id = $2', [goalOne, goalTwo]);
  }
}

async function main(): Promise<void> {
  await partOne();
  await partTwo();
  await partThree();
  console.log(`\n${passed} passed, ${failed} failed`);
  await pool.end();
  if (failed > 0) process.exit(1);
}

main().catch(async (err) => {
  console.error(err);
  await pool.end().catch(() => undefined);
  process.exit(1);
});