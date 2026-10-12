/**
 * Unit tests for the progress summary and the request validators (no database needed).
 * Run from the backend folder:  npx ts-node --transpile-only src/tests/progressSummary.test.ts
 */
import assert from 'node:assert';
import { GoalGraphData, GoalSkillNode } from '../services/algorithm/recommendationEngine';
import { skillCompletion, summarizeProgress } from '../services/algorithm/progressSummary';
import { isPositiveInt, isUuid } from '../middleware/validate';

let passed = 0;
let failed = 0;

const test = (name: string, fn: () => void): void => {
  try {
    fn();
    passed += 1;
    console.log(`ok    ${name}`);
  } catch (err) {
    failed += 1;
    console.log(`FAIL  ${name}\n      ${(err as Error).message}`);
  }
};

const skill = (
  skillId: number,
  category: string | null,
  importance: number,
  estimatedHours: number,
  requiredMastery = 0.8
): GoalSkillNode => ({ skillId, name: `S${skillId}`, category, requiredMastery, importance, estimatedHours });

/** Frontend: S1 (hours 10), S2 (hours 20). Backend: S3 (hours 40). All need 0.8 */
const buildGraph = (progress: [number, number, number][] = []): GoalGraphData => ({
  skills: [skill(1, 'Frontend', 1, 10), skill(2, 'Frontend', 1, 20), skill(3, 'Backend', 1, 40)],
  edges: [],
  progress: new Map(progress.map(([id, mastery, confidence]) => [id, { mastery, confidence }])),
});

test('no progress gives 0% and the full hours', () => {
  const summary = summarizeProgress(buildGraph());
  assert.strictEqual(summary.percent, 0);
  assert.strictEqual(summary.masteredSkills, 0);
  assert.strictEqual(summary.hoursRemaining, 70);
});

test('a mastered skill counts as complete and removes its hours', () => {
  const summary = summarizeProgress(buildGraph([[1, 0.9, 0.9]]));
  assert.strictEqual(summary.masteredSkills, 1);
  assert.strictEqual(summary.percent, 33); // 1 of 3 equal skills
  assert.strictEqual(summary.hoursRemaining, 60);
});

test('half way to the requirement counts as half, hours shrink by the same share', () => {
  const summary = summarizeProgress(buildGraph([[3, 0.4, 0.5]])); // 0.4 / 0.8 = 50%
  assert.strictEqual(summary.masteredSkills, 0);
  assert.strictEqual(summary.percent, 17); // (0 + 0 + 0.5) / 3
  assert.strictEqual(summary.hoursRemaining, 50); // 10 + 20 + 20
});

test('high mastery with low confidence is not mastered yet', () => {
  const summary = summarizeProgress(buildGraph([[1, 0.9, 0.3]]));
  assert.strictEqual(summary.masteredSkills, 0);
  assert.strictEqual(summary.percent, 33); // the score still counts for the percent
});

test('categories are grouped and sorted', () => {
  const summary = summarizeProgress(buildGraph([[1, 0.9, 0.9]]));
  assert.deepStrictEqual(
    summary.categories.map((c) => [c.category, c.totalSkills, c.masteredSkills, c.percent]),
    [
      ['Backend', 1, 0, 0],
      ['Frontend', 2, 1, 50],
    ]
  );
});

test('a skill without a category goes to General', () => {
  const data: GoalGraphData = { skills: [skill(1, null, 1, 5)], edges: [], progress: new Map() };
  assert.strictEqual(summarizeProgress(data).categories[0].category, 'General');
});

test('importance weights the percent', () => {
  const data: GoalGraphData = {
    skills: [skill(1, 'A', 0.9, 10), skill(2, 'A', 0.1, 10)],
    edges: [],
    progress: new Map([[2, { mastery: 0.8, confidence: 0.9 }]]),
  };
  assert.strictEqual(summarizeProgress(data).percent, 10); // only the 0.1 skill is done
});

test('an empty goal gives zeros and never divides by zero', () => {
  const summary = summarizeProgress({ skills: [], edges: [], progress: new Map() });
  assert.strictEqual(summary.percent, 0);
  assert.strictEqual(summary.hoursRemaining, 0);
  assert.deepStrictEqual(summary.categories, []);
});

test('skillCompletion never goes above 1', () => {
  assert.strictEqual(skillCompletion(skill(1, null, 1, 1), { mastery: 1, confidence: 1 }), 1);
});

test('isPositiveInt accepts 1 and "7" but not 0, -1, 1.5, "abc" or empty values', () => {
  assert.ok(isPositiveInt(1) && isPositiveInt('7'));
  for (const bad of [0, -1, 1.5, 'abc', '', ' ', null, undefined, [], {}]) assert.ok(!isPositiveInt(bad));
});

test('isUuid accepts a real uuid only', () => {
  assert.ok(isUuid('3f2b8c1e-5d4a-4b7e-9c1d-2a6f8e0b1c3d'));
  assert.ok(!isUuid('123') && !isUuid('') && !isUuid(5) && !isUuid(undefined));
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);