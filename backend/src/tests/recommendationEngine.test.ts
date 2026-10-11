/**
 * Unit tests for the recommendation engine (no database needed).
 * Run from the backend folder:  npx ts-node --transpile-only src/tests/recommendationEngine.test.ts
 */
import assert from 'node:assert';
import {
  GoalGraphData,
  GoalSkillNode,
  computeReadiness,
  computeUnlockValue,
  getCandidateSkills,
  getNextBestSkill,
  getSkillStates,
  rankCandidates,
} from '../services/algorithm/recommendationEngine';

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

const names = (list: { name: string }[]): string[] => list.map((item) => item.name);
const rankedNames = (list: { skillName: string }[]): string[] => list.map((item) => item.skillName);

test('a user with no mastery gets only skills without prerequisites as candidates', () => {
  const data = buildGraph();
  assert.deepStrictEqual(names(getCandidateSkills(data)), ['A', 'D']);
  const states = getSkillStates(data);
  assert.deepStrictEqual([...states.values()], ['READY', 'LOCKED', 'LOCKED', 'READY']);
});

test('a beginner gets a valid recommendation (the foundational skill first)', () => {
  const result = getNextBestSkill(buildGraph());
  assert.strictEqual(result.goalComplete, false);
  assert.strictEqual(result.next?.skillName, 'A');
});

test('utility of the first candidate matches the formula by hand', () => {
  // A: goalImpact 80, readiness 100, unlock 100 (B + C), gap 100, efficiency 100 (10h is the lowest)
  // 0.30*80 + 0.25*100 + 0.20*100 + 0.15*100 + 0.10*100 = 94
  const [first, second] = rankCandidates(buildGraph());
  assert.strictEqual(first.utilityScore, 94);
  assert.deepStrictEqual(first.factors, {
    goalImpact: 80,
    readiness: 100,
    unlockPotential: 100,
    gapPriority: 100,
    timeEfficiency: 100,
  });
  // D: 0.30*50 + 0.25*100 + 0 + 0.15*100 + 0 = 55
  assert.strictEqual(second.skillName, 'D');
  assert.strictEqual(second.utilityScore, 55);
});

test('contributions add up to the utility score', () => {
  for (const candidate of rankCandidates(buildGraph())) {
    const sum = Object.values(candidate.contributions).reduce((a, b) => a + b, 0);
    assert.ok(Math.abs(sum - candidate.utilityScore) < 0.2, `${candidate.skillName}: ${sum} vs ${candidate.utilityScore}`);
  }
});

test('a mastered skill is never returned', () => {
  const data = buildGraph([[1, 0.8, 0.8]]); // A mastered
  const result = getNextBestSkill(data);
  assert.ok(!rankedNames(result.candidates).includes('A'));
  assert.deepStrictEqual(rankedNames(result.candidates).sort(), ['B', 'D']);
});

test('high mastery with low confidence is NOT mastered and stays a candidate', () => {
  const data = buildGraph([[1, 0.9, 0.5]]);
  assert.strictEqual(getSkillStates(data).get(1), 'READY');
  const a = rankCandidates(data).find((candidate) => candidate.skillName === 'A');
  assert.ok(a, 'A should be a candidate');
  assert.strictEqual(a?.gap, 0);
  assert.strictEqual(a?.factors.gapPriority, 0);
});

test('a skill with an unmet prerequisite is never a candidate', () => {
  // B needs A at 0.7 but A is only 0.5
  const data = buildGraph([[1, 0.5, 0.7]]);
  assert.strictEqual(getSkillStates(data).get(2), 'LOCKED');
  assert.ok(!names(getCandidateSkills(data)).includes('B'));
  assert.ok(!names(getCandidateSkills(data)).includes('C'));
});

test('a prerequisite is satisfied by its mastery threshold (confidence is not required)', () => {
  const data = buildGraph([[1, 0.75, 0.2]]);
  assert.strictEqual(getSkillStates(data).get(2), 'READY');
});

test('changing mastery changes the recommendation', () => {
  const before = getNextBestSkill(buildGraph()).next?.skillName;
  const after = getNextBestSkill(buildGraph([[1, 0.8, 0.8]])).next?.skillName; // A mastered
  assert.strictEqual(before, 'A');
  assert.strictEqual(after, 'B');
});

test('when every skill is mastered the engine returns goalComplete', () => {
  const data = buildGraph([[1, 0.9, 0.9], [2, 0.9, 0.9], [3, 0.9, 0.9], [4, 0.9, 0.9]]);
  const result = getNextBestSkill(data);
  assert.strictEqual(result.goalComplete, true);
  assert.strictEqual(result.next, null);
  assert.deepStrictEqual(result.candidates, []);
});

test('a goal without skills is not "complete"', () => {
  const result = getNextBestSkill({ skills: [], edges: [], progress: new Map() });
  assert.strictEqual(result.goalComplete, false);
  assert.strictEqual(result.next, null);
});

test('readiness is 100 without prerequisites', () => {
  assert.strictEqual(computeReadiness(buildGraph().skills[0], buildGraph()), 100);
});

test('readiness is the weighted average of min(mastery / required, 1)', () => {
  // B has one prerequisite A: required 0.7, mastery 0.35 -> ratio 0.5 -> readiness 50
  const data = buildGraph([[1, 0.35, 0.5]]);
  assert.strictEqual(computeReadiness(data.skills[1], data), 50);

  // Two prerequisites: P1 (importance 1.0) ratio 1, P2 (importance 0.5) ratio 0.5 -> (1 + 0.25) / 1.5 = 83.3
  const two: GoalGraphData = {
    skills: [skill(1, 'P1', 1.0, 5), skill(2, 'P2', 0.5, 5), skill(3, 'X', 0.9, 5)],
    edges: [
      { skillId: 3, prerequisiteId: 1 },
      { skillId: 3, prerequisiteId: 2 },
    ],
    progress: new Map([
      [1, { mastery: 0.9, confidence: 0.9 }],
      [2, { mastery: 0.35, confidence: 0.9 }],
    ]),
  };
  assert.ok(Math.abs(computeReadiness(two.skills[2], two) - 83.33) < 0.1);
});

test('readiness never goes above 100 even if mastery is above the requirement', () => {
  const data = buildGraph([[1, 1, 1]]);
  assert.strictEqual(computeReadiness(data.skills[1], data), 100);
});

test('unlock potential follows the graph through several levels (BFS)', () => {
  const data = buildGraph();
  // From A: B (1.0) and C (0.6) are reachable
  assert.ok(Math.abs(computeUnlockValue(data.skills[0], data) - 1.6) < 1e-9);
  // From B: only C
  assert.ok(Math.abs(computeUnlockValue(data.skills[1], data) - 0.6) < 1e-9);
  // D unlocks nothing
  assert.strictEqual(computeUnlockValue(data.skills[3], data), 0);
});

test('unlock potential ignores skills that are already mastered', () => {
  const data = buildGraph([[3, 0.9, 0.9]]); // C mastered
  assert.ok(Math.abs(computeUnlockValue(data.skills[0], data) - 1.0) < 1e-9);
});

test('a skill that unlocks more important skills has a higher unlock potential', () => {
  const data: GoalGraphData = {
    skills: [skill(1, 'Big', 0.5, 10), skill(2, 'Small', 0.5, 10), skill(3, 'Important', 1.0, 10), skill(4, 'Minor', 0.2, 10)],
    edges: [
      { skillId: 3, prerequisiteId: 1 },
      { skillId: 4, prerequisiteId: 2 },
    ],
    progress: new Map(),
  };
  const ranked = rankCandidates(data);
  const big = ranked.find((c) => c.skillName === 'Big');
  const small = ranked.find((c) => c.skillName === 'Small');
  assert.strictEqual(big?.factors.unlockPotential, 100);
  assert.ok((small?.factors.unlockPotential ?? 100) < 100);
});

test('a cycle in the data does not hang the traversal', () => {
  const data: GoalGraphData = {
    skills: [skill(1, 'A', 0.5, 10), skill(2, 'B', 0.5, 10)],
    edges: [
      { skillId: 2, prerequisiteId: 1 },
      { skillId: 1, prerequisiteId: 2 },
    ],
    progress: new Map(),
  };
  assert.strictEqual(computeUnlockValue(data.skills[0], data), 0.5);
});

test('time efficiency: fewer hours is better, equal hours are not punished', () => {
  const ranked = rankCandidates(buildGraph());
  const a = ranked.find((c) => c.skillName === 'A');
  const d = ranked.find((c) => c.skillName === 'D');
  assert.strictEqual(a?.factors.timeEfficiency, 100);
  assert.strictEqual(d?.factors.timeEfficiency, 0);

  const equal: GoalGraphData = {
    skills: [skill(1, 'X', 0.5, 10), skill(2, 'Y', 0.5, 10)],
    edges: [],
    progress: new Map(),
  };
  assert.deepStrictEqual(rankCandidates(equal).map((c) => c.factors.timeEfficiency), [100, 100]);
});

test('gap priority is the missing part of the required mastery', () => {
  const data = buildGraph([[4, 0.35, 0.8]]); // D required 0.7, current 0.35 -> gap 0.35 -> 50
  const d = rankCandidates(data).find((c) => c.skillName === 'D');
  assert.strictEqual(d?.gap, 35);
  assert.strictEqual(d?.factors.gapPriority, 50);
});

test('ties are broken by goal impact, then by skill id (stable order)', () => {
  const equal: GoalGraphData = {
    skills: [skill(2, 'Second', 0.5, 10), skill(1, 'First', 0.5, 10)],
    edges: [],
    progress: new Map(),
  };
  assert.deepStrictEqual(rankedNames(rankCandidates(equal)), ['First', 'Second']);
});

test('all factors stay inside 0-100 and the utility inside 0-100', () => {
  for (const candidate of rankCandidates(buildGraph([[1, 0.3, 0.4]]))) {
    for (const value of Object.values(candidate.factors)) assert.ok(value >= 0 && value <= 100);
    assert.ok(candidate.utilityScore >= 0 && candidate.utilityScore <= 100);
  }
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);