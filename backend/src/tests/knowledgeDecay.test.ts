/**
 * Unit tests for the knowledge decay maths (src/services/algorithm/knowledgeDecay.ts).
 * No database needed. Run from the backend folder:
 *   npx ts-node --transpile-only src/tests/knowledgeDecay.test.ts
 */
import assert from 'node:assert';
import {
  DUE_RETENTION,
  daysUntilRetention,
  halfLifeDays,
  memoryHealth,
  retentionAfter,
  statusFor,
} from '../services/algorithm/knowledgeDecay';

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

const near = (actual: number, expected: number, tolerance = 0.001): void =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `expected ${expected}, got ${actual}`);

const NOW = new Date('2026-10-13T12:00:00.000Z');
const daysAgo = (days: number): Date => new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000);

test('half-life is 14 days at confidence 0 and 60 days at confidence 1', () => {
  assert.strictEqual(halfLifeDays(0), 14);
  assert.strictEqual(halfLifeDays(1), 60);
});

test('half-life ignores confidence values outside 0-1', () => {
  assert.strictEqual(halfLifeDays(-3), 14);
  assert.strictEqual(halfLifeDays(5), 60);
});

test('retention is 1 on the test day and exactly 0.5 after one half-life', () => {
  assert.strictEqual(retentionAfter(0.5, 0), 1);
  near(retentionAfter(0, 14), 0.5);
  near(retentionAfter(1, 60), 0.5);
});

test('retention never goes up as time passes', () => {
  let previous = 1;
  for (let day = 0; day <= 200; day += 5) {
    const value = retentionAfter(0.7, day);
    assert.ok(value <= previous);
    previous = value;
  }
});

test('a higher confidence is forgotten more slowly', () => {
  assert.ok(retentionAfter(0.95, 30) > retentionAfter(0.7, 30));
});

test('a date in the future counts as day 0', () => {
  assert.strictEqual(retentionAfter(0.8, -10), 1);
});

test('daysUntilRetention is the inverse of retentionAfter', () => {
  const days = daysUntilRetention(0.8, DUE_RETENTION);
  near(retentionAfter(0.8, days), DUE_RETENTION);
});

test('status thresholds: fresh from 85%, fading from 70%, otherwise due', () => {
  assert.strictEqual(statusFor(1), 'FRESH');
  assert.strictEqual(statusFor(0.85), 'FRESH');
  assert.strictEqual(statusFor(0.84), 'FADING');
  assert.strictEqual(statusFor(0.7), 'FADING');
  assert.strictEqual(statusFor(0.69), 'DUE');
  assert.strictEqual(statusFor(0), 'DUE');
});

test('a skill tested today is fresh with full memory', () => {
  const health = memoryHealth({ mastery: 0.8, confidence: 0.7, lastAssessedAt: NOW }, NOW);
  assert.strictEqual(health.retention, 100);
  assert.strictEqual(health.effectiveMastery, 80);
  assert.strictEqual(health.daysSinceTest, 0);
  assert.strictEqual(health.status, 'FRESH');
});

test('review date is about 24 days after the test at confidence 0.7', () => {
  const health = memoryHealth({ mastery: 0.8, confidence: 0.7, lastAssessedAt: NOW }, NOW);
  assert.strictEqual(health.daysUntilReview, 24);
  const expected = NOW.getTime() + daysUntilRetention(0.7, DUE_RETENTION) * 24 * 60 * 60 * 1000;
  assert.strictEqual(health.nextReviewAt, new Date(expected).toISOString());
});

test('the review date does not move while time passes', () => {
  const tested = daysAgo(10);
  const early = memoryHealth({ mastery: 0.8, confidence: 0.7, lastAssessedAt: tested }, daysAgo(5));
  const late = memoryHealth({ mastery: 0.8, confidence: 0.7, lastAssessedAt: tested }, NOW);
  assert.strictEqual(early.nextReviewAt, late.nextReviewAt);
});

test('after 30 days at confidence 0.7 the skill is due and effective mastery is lower', () => {
  const health = memoryHealth({ mastery: 0.8, confidence: 0.7, lastAssessedAt: daysAgo(30) }, NOW);
  assert.strictEqual(health.status, 'DUE');
  assert.strictEqual(health.retention, 64);
  assert.strictEqual(health.effectiveMastery, 51);
  assert.strictEqual(health.daysSinceTest, 30);
  assert.strictEqual(health.daysUntilReview, 0);
});

test('a skill between 70% and 85% retention is fading', () => {
  const health = memoryHealth({ mastery: 0.9, confidence: 0.7, lastAssessedAt: daysAgo(15) }, NOW);
  assert.strictEqual(health.status, 'FADING');
  assert.ok(health.daysUntilReview > 0);
});

test('effective mastery is never above the stored mastery', () => {
  for (const days of [0, 3, 20, 90, 400]) {
    const health = memoryHealth({ mastery: 0.75, confidence: 0.9, lastAssessedAt: daysAgo(days) }, NOW);
    assert.ok(health.effectiveMastery <= 75);
    assert.ok(health.retention >= 0 && health.retention <= 100);
  }
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);