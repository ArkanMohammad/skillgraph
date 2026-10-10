/**
 * Adaptive question selection (pure functions: no database, easy to unit test).
 * اختيار الأسئلة التكيّفي (دوال نقية بدون قاعدة بيانات، سهلة الاختبار).
 *
 * Rules:
 *  - The first question is medium (difficulty 2).
 *  - A correct answer makes the next target one level harder (max 3).
 *  - A wrong answer makes the next target one level easier (min 1).
 *  - Among the questions that are not answered yet we pick the one closest to the target,
 *    preferring a concept that was asked the least, so every concept gets covered.
 */
import { Difficulty } from '../../models';

/** How many questions one assessment asks (each skill has 6, so the choice matters) */
export const QUESTIONS_PER_ASSESSMENT = 4;

/** Difficulty of the first question / صعوبة السؤال الأول */
export const START_DIFFICULTY: Difficulty = 2;

export interface PoolQuestion {
  id: number;
  conceptId: number | null;
  difficulty: Difficulty;
}

export interface AnsweredQuestion extends PoolQuestion {
  isCorrect: boolean;
}

/** One step up after a correct answer, one step down after a wrong one */
export const nextDifficulty = (current: Difficulty, wasCorrect: boolean): Difficulty => {
  const moved = current + (wasCorrect ? 1 : -1);
  return Math.min(3, Math.max(1, moved)) as Difficulty;
};

/** Replays the answers (oldest first) to find the difficulty we want for the next question */
export const targetDifficulty = (answered: AnsweredQuestion[]): Difficulty =>
  answered.reduce<Difficulty>((target, item) => nextDifficulty(target, item.isCorrect), START_DIFFICULTY);

/** Number of questions this assessment will ask (never more than the skill has) */
export const totalQuestionsFor = (poolSize: number): number =>
  Math.min(QUESTIONS_PER_ASSESSMENT, poolSize);

/**
 * Picks the next question, or null when nothing is left.
 * Sort order: closest difficulty to the target, then the least asked concept,
 * then the easier one, then the lowest id (so the result is always the same).
 */
export const pickNextQuestion = (
  pool: PoolQuestion[],
  answered: AnsweredQuestion[]
): PoolQuestion | null => {
  const answeredIds = new Set(answered.map((item) => item.id));
  const remaining = pool.filter((question) => !answeredIds.has(question.id));
  if (remaining.length === 0) return null;

  const target = targetDifficulty(answered);

  const askedPerConcept = new Map<number | null, number>();
  for (const item of answered) {
    askedPerConcept.set(item.conceptId, (askedPerConcept.get(item.conceptId) ?? 0) + 1);
  }
  const askedCount = (conceptId: number | null): number => askedPerConcept.get(conceptId) ?? 0;

  const sorted = [...remaining].sort(
    (a, b) =>
      Math.abs(a.difficulty - target) - Math.abs(b.difficulty - target) ||
      askedCount(a.conceptId) - askedCount(b.conceptId) ||
      a.difficulty - b.difficulty ||
      a.id - b.id
  );
  return sorted[0];
};