/**
 * Unit tests for changing the goal and for the recommendation after progress changes
 * (no database needed). The progress of a user is stored per skill, so two goals that share
 * a skill see the same mastery. Here the same progress map is used with two different goals.
 * Run from the backend folder:  npx ts-node --transpile-only src/tests/goalChange.test.ts
 */
import assert from 'node:assert';
import {
  GoalGraphData,
  GoalSkillNode,
  UserProgress,
  getNextBestSkill,
  getSkillStates,
} from '../services/algorithm/recommendationEngine';
import { summarizeProgress } from '../services/algorithm/progressSummary';

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

const skill = (skillId: number, name: string, importance: number, estimatedHours: number): GoalSkillNode => ({
  skillId,
  name,
  category: null,
  requiredMastery: 0.7,
  importance,
  estimatedHours,
});

/** Skills 1 (HTML) and 2 (CSS) are shared by both goals */
const HTML = skill(1, 'HTML', 0.8, 10);
const CSS = skill(2, 'CSS', 0.8, 15);
const JS = skill(3, 'JS', 0.9, 30);
const SQL = skill(4, 'SQL', 0.9, 25);

/** Frontend goal: HTML -> CSS -> JS */
const frontendGoal = (progress: Map<number, UserProgress>): GoalGraphData => ({
  skills: [HTML, CSS, JS],
  edges: [
    { skillId: 2, prerequisiteId: 1 },
    { skillId: 3, prerequisiteId: 2 },
  ],
  progress,
});

/** Small goal: only HTML and CSS (used for goalComplete) */
const basicsGoal = (progress: Map<number, UserProgress>): GoalGraphData => ({
  skills: [HTML, CSS],
  edges: [{ skillId: 2, prerequisiteId: 1 }],
  progress,
});

/** Backend goal: HTML -> SQL (SQL is not part of the frontend goal) */
const backendGoal = (progress: Map<number, UserProgress>): GoalGraphData => ({
  skills: [HTML, SQL],
  edges: [{ skillId: 4, prerequisiteId: 1 }],
  progress,
});

const mastered = (): UserProgress => ({ mastery: 0.9, confidence: 0.9 });

const rankedNames = (data: GoalGraphData): string[] => getNextBestSkill(data).candidates.map((c) => c.skillName);

test('changing the goal keeps the mastery: a mastered shared skill is never recommended again', () => {
  const progress = new Map<number, UserProgress>([[1, mastered()]]);
  assert.ok(!rankedNames(frontendGoal(progress)).includes('HTML'));
  assert.ok(!rankedNames(backendGoal(progress)).includes('HTML'));
});

test('changing the goal unlocks the skills that depend on the shared mastery', () => {
  const progress = new Map<number, UserProgress>([[1, mastered()]]);
  assert.deepStrictEqual(rankedNames(frontendGoal(progress)), ['CSS']);
  assert.deepStrictEqual(rankedNames(backendGoal(progress)), ['SQL']);
});

test('without any mastery both goals start from the same foundation skill', () => {
  const none = new Map<number, UserProgress>();
  assert.deepStrictEqual(rankedNames(frontendGoal(none)), ['HTML']);
  assert.deepStrictEqual(rankedNames(backendGoal(none)), ['HTML']);
});

test('a skill that is not part of the new goal is ignored, even if the user mastered it', () => {
  const progress = new Map<number, UserProgress>([
    [1, mastered()],
    [4, mastered()], // SQL is mastered but only belongs to the backend goal
  ]);
  const frontend = frontendGoal(progress);
  assert.ok(!frontend.skills.some((s) => s.name === 'SQL'));
  assert.ok(!rankedNames(frontend).includes('SQL'));
  assert.strictEqual(getSkillStates(frontend).get(4), undefined);
});

test('the progress percent of the new goal starts above zero when skills are shared', () => {
  const progress = new Map<number, UserProgress>([[1, mastered()]]);
  assert.ok(summarizeProgress(backendGoal(progress)).percent > 0);
  assert.ok(summarizeProgress(frontendGoal(progress)).percent > 0);
  assert.strictEqual(summarizeProgress(backendGoal(new Map())).percent, 0);
});

test('the same progress gives goalComplete in a small goal but not in a bigger one', () => {
  const progress = new Map<number, UserProgress>([
    [1, mastered()],
    [2, mastered()],
  ]);
  const small = getNextBestSkill(basicsGoal(progress));
  assert.strictEqual(small.goalComplete, true);
  assert.strictEqual(small.next, null);
  assert.deepStrictEqual(small.candidates, []);

  const bigger = getNextBestSkill(frontendGoal(progress));
  assert.strictEqual(bigger.goalComplete, false);
  assert.strictEqual(bigger.next?.skillName, 'JS');
});

test('a goal without skills never reports goalComplete', () => {
  const empty = getNextBestSkill({ skills: [], edges: [], progress: new Map() });
  assert.strictEqual(empty.goalComplete, false);
  assert.strictEqual(empty.next, null);
});

test('improving a skill changes the recommendation, lowering it brings the old one back', () => {
  const progress = new Map<number, UserProgress>();
  assert.strictEqual(getNextBestSkill(frontendGoal(progress)).next?.skillName, 'HTML');

  progress.set(1, mastered());
  assert.strictEqual(getNextBestSkill(frontendGoal(progress)).next?.skillName, 'CSS');

  progress.set(1, { mastery: 0.3, confidence: 0.9 }); // the user failed a retake
  assert.strictEqual(getNextBestSkill(frontendGoal(progress)).next?.skillName, 'HTML');
});

test('unlock potential: the skill that opens more important skills gets the higher score', () => {
  // HTML opens CSS and JS (two levels), CSS opens only JS
  const none = getNextBestSkill(frontendGoal(new Map()));
  const html = none.candidates.find((c) => c.skillName === 'HTML');
  assert.ok(html);
  assert.strictEqual(html?.factors.unlockPotential, 100); // the only candidate is the maximum

  const afterHtml = getNextBestSkill(frontendGoal(new Map([[1, mastered()]])));
  const css = afterHtml.candidates.find((c) => c.skillName === 'CSS');
  assert.ok(css);
  assert.ok((css?.factors.unlockPotential ?? 0) > 0); // CSS still opens JS
});

test('an unlock comparison between two candidates: the one with more downstream value wins that factor', () => {
  // A (no prerequisite) opens B and C, D (no prerequisite) opens nothing
  const a = skill(10, 'A', 0.5, 10);
  const d = skill(11, 'D', 0.5, 10);
  const data: GoalGraphData = {
    skills: [a, skill(12, 'B', 0.9, 10), skill(13, 'C', 0.9, 10), d],
    edges: [
      { skillId: 12, prerequisiteId: 10 },
      { skillId: 13, prerequisiteId: 10 },
    ],
    progress: new Map(),
  };
  const ranked = getNextBestSkill(data).candidates;
  const unlockOf = (name: string): number => ranked.find((c) => c.skillName === name)?.factors.unlockPotential ?? -1;
  assert.strictEqual(unlockOf('A'), 100);
  assert.strictEqual(unlockOf('D'), 0);
  assert.strictEqual(ranked[0].skillName, 'A');
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);