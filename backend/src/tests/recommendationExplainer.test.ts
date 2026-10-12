/**
 * Unit tests for the recommendation explainer (no database needed).
 * Run from the backend folder:  npx ts-node --transpile-only src/tests/recommendationExplainer.test.ts
 */
import assert from 'node:assert';
import { GoalGraphData, GoalSkillNode, rankCandidates } from '../services/algorithm/recommendationEngine';
import {
  countUnlockedSkills,
  explainCandidate,
  explainCandidates,
} from '../services/algorithm/recommendationExplainer';

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
  name: string,
  importance: number,
  estimatedHours: number,
  requiredMastery = 0.7
): GoalSkillNode => ({ skillId, name, category: null, requiredMastery, importance, estimatedHours });

/**
 * A (no prerequisite) -> B -> C, and D on its own.
 * Importance: A 0.8, B 1.0, C 0.6, D 0.5. Hours: A 10, B 20, C 5, D 40.
 */
const buildGraph = (progress: [number, number, number][] = []): GoalGraphData => ({
  skills: [skill(1, 'A', 0.8, 10), skill(2, 'B', 1.0, 20), skill(3, 'C', 0.6, 5), skill(4, 'D', 0.5, 40)],
  edges: [
    { skillId: 2, prerequisiteId: 1 },
    { skillId: 3, prerequisiteId: 2 },
  ],
  progress: new Map(progress.map(([id, mastery, confidence]) => [id, { mastery, confidence }])),
});

test('countUnlockedSkills counts direct and indirect skills that follow', () => {
  const data = buildGraph();
  assert.strictEqual(countUnlockedSkills(1, data), 2); // B and C
  assert.strictEqual(countUnlockedSkills(2, data), 1); // C
  assert.strictEqual(countUnlockedSkills(4, data), 0); // D has nothing after it
});

test('countUnlockedSkills ignores skills that are already mastered', () => {
  const data = buildGraph([[3, 0.9, 0.9]]); // C mastered
  assert.strictEqual(countUnlockedSkills(1, data), 1); // only B is left
});

test('every candidate gets an explanation', () => {
  const data = buildGraph();
  const explained = explainCandidates(rankCandidates(data), data);
  assert.ok(explained.length > 0);
  for (const candidate of explained) {
    assert.ok(candidate.explanation.summary.includes(candidate.skillName));
  }
});

test('the summary names the skill and gives at most three reasons', () => {
  const data = buildGraph();
  const ranked = rankCandidates(data);
  const explanation = explainCandidate(ranked[0], data, ranked[1] ?? null);
  assert.ok(explanation.summary.startsWith(`${ranked[0].skillName} is recommended`));
  assert.ok(explanation.reasons.length <= 3);
});

test('the unlock reason shows the real number of skills', () => {
  const data = buildGraph();
  const ranked = rankCandidates(data);
  const a = ranked.find((c) => c.skillName === 'A');
  assert.ok(a);
  const explanation = explainCandidate(a, data, null);
  assert.strictEqual(explanation.unlocksCount, 2);
  assert.ok(explanation.reasons.some((reason) => reason.includes('2 more skills')));
});

test('the margin is the utility difference to the runner-up', () => {
  const data = buildGraph();
  const ranked = rankCandidates(data);
  assert.ok(ranked.length >= 2);
  const explanation = explainCandidate(ranked[0], data, ranked[1]);
  const expected = Math.round((ranked[0].utilityScore - ranked[1].utilityScore) * 10) / 10;
  assert.strictEqual(explanation.margin, expected);
  assert.ok(explanation.summary.includes(ranked[1].skillName));
});

test('a single candidate has no margin and no comparison sentence', () => {
  const data = buildGraph();
  const ranked = rankCandidates(data);
  const explanation = explainCandidate(ranked[0], data, null);
  assert.strictEqual(explanation.margin, null);
  assert.ok(!explanation.summary.includes('points higher'));
});

test('replanning: mastering the recommended skill changes the next recommendation', () => {
  const before = rankCandidates(buildGraph());
  const first = before[0];
  const after = rankCandidates(buildGraph([[first.skillId, 0.9, 0.9]]));
  assert.ok(after.length > 0);
  assert.notStrictEqual(after[0].skillId, first.skillId);
  assert.ok(!after.some((candidate) => candidate.skillId === first.skillId));
});

test('replanning: mastering A unlocks B as a new candidate', () => {
  const before = rankCandidates(buildGraph()).map((c) => c.skillName);
  assert.ok(!before.includes('B'));
  const after = rankCandidates(buildGraph([[1, 0.9, 0.9]])).map((c) => c.skillName);
  assert.ok(after.includes('B'));
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);