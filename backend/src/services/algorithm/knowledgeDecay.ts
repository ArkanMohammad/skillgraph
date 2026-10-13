/**
 * Knowledge decay (pure functions: no database, easy to unit test).
 *
 * People forget. A skill that was mastered weeks ago is not as safe as one mastered yesterday,
 * so SkillGraph shows how strong each mastered skill is in the user's memory TODAY.
 *
 * Model (a simple forgetting curve):
 *   retention = 0.5 ^ (daysSinceLastTest / halfLife)
 * - retention is 1 right after a test and falls towards 0 over time.
 * - halfLife is the number of days after which half of the knowledge is gone.
 *   A user who proved a skill with high confidence keeps it longer, so the half-life
 *   grows with the stored confidence (14 days at confidence 0, 60 days at confidence 1).
 *
 * The stored mastery in the database is never changed by decay. Decay is calculated live,
 * so nothing is lost and a new test (a review) simply starts the curve again.
 */

/** Half-life in days for a confidence of 0 */
export const MIN_HALF_LIFE_DAYS = 14;

/** Half-life in days for a confidence of 1 */
export const MAX_HALF_LIFE_DAYS = 60;

/** At or above this retention a skill is still fresh in memory */
export const FRESH_RETENTION = 0.85;

/** Below this retention the skill should be reviewed */
export const DUE_RETENTION = 0.7;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export type MemoryStatus = 'FRESH' | 'FADING' | 'DUE';

export interface MemoryInput {
  mastery: number; // 0-1, as stored
  confidence: number; // 0-1, as stored
  lastAssessedAt: Date;
}

export interface MemoryHealth {
  retention: number; // 0-100, how much of the knowledge is still in memory
  effectiveMastery: number; // 0-100, stored mastery multiplied by the retention
  daysSinceTest: number; // whole days, never negative
  halfLifeDays: number; // whole days
  status: MemoryStatus;
  nextReviewAt: string; // ISO date: the moment retention drops below DUE_RETENTION
  daysUntilReview: number; // whole days, 0 when the review is already due
}

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

/** Days after which half of the knowledge is forgotten; more confidence means slower forgetting */
export const halfLifeDays = (confidence: number): number =>
  MIN_HALF_LIFE_DAYS + (MAX_HALF_LIFE_DAYS - MIN_HALF_LIFE_DAYS) * clamp01(confidence);

/** Share (0-1) of the knowledge that is still remembered after the given number of days */
export const retentionAfter = (confidence: number, days: number): number =>
  Math.pow(0.5, Math.max(0, days) / halfLifeDays(confidence));

/** Days until the retention falls to the given level (0-1) */
export const daysUntilRetention = (confidence: number, level: number): number =>
  halfLifeDays(confidence) * Math.log2(1 / level);

/** FRESH, FADING or DUE for a retention between 0 and 1 */
export const statusFor = (retention: number): MemoryStatus => {
  if (retention >= FRESH_RETENTION) return 'FRESH';
  if (retention >= DUE_RETENTION) return 'FADING';
  return 'DUE';
};

/** How well the user still remembers one skill at the moment `now` */
export const memoryHealth = (input: MemoryInput, now: Date): MemoryHealth => {
  const elapsedDays = Math.max(0, (now.getTime() - input.lastAssessedAt.getTime()) / MS_PER_DAY);
  const retention = retentionAfter(input.confidence, elapsedDays);

  // The review date is fixed by the test date, so it does not move while time passes
  const reviewAfterDays = daysUntilRetention(input.confidence, DUE_RETENTION);
  const nextReview = new Date(input.lastAssessedAt.getTime() + reviewAfterDays * MS_PER_DAY);
  const daysUntilReview = Math.max(0, Math.ceil((nextReview.getTime() - now.getTime()) / MS_PER_DAY));

  return {
    retention: Math.round(retention * 100),
    effectiveMastery: Math.round(clamp01(input.mastery) * retention * 100),
    daysSinceTest: Math.floor(elapsedDays),
    halfLifeDays: Math.round(halfLifeDays(input.confidence)),
    status: statusFor(retention),
    nextReviewAt: nextReview.toISOString(),
    daysUntilReview,
  };
};