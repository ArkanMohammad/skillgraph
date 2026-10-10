/**
 * Assessment scoring (pure functions: no database, easy to unit test).
 *
 * How a score is built:
 *  1. Every answered question counts with a weight equal to its difficulty
 *     (easy = 1, medium = 2, hard = 3), so a hard question is worth more.
 *  2. Concept score = weighted share of correct answers inside that concept.
 *  3. Skill score = weighted average of the concept scores, using the concept
 *     weights from the database. Concepts that were not asked are left out and
 *     their weight is shared between the concepts that were asked.
 *  4. Confidence says how much we trust the score (coverage, sample size, consistency).
 */
import { SkillState } from '../../models';
import { AnsweredQuestion, QUESTIONS_PER_ASSESSMENT } from './adaptiveService';

/** Confidence needed (together with enough mastery) to call a skill mastered */
export const MASTERED_CONFIDENCE = 0.7;

/** Below this share of the required mastery a skill is still in its first steps */
const PRACTICING_RATIO = 0.6;

/** A concept as stored in the database */
export interface ConceptInfo {
  id: number;
  name: string;
  weight: number; // 0-1, the weights of one skill add up to 1
}

/** Result for one concept (only concepts that were asked appear) */
export interface ConceptResult {
  conceptId: number | null;
  name: string;
  weight: number; // 0-100, share of the skill
  correct: number;
  total: number;
  score: number; // 0-100, difficulty weighted
}

export interface ScoreResult {
  finalScore: number; // 0-100, whole number
  correctAnswers: number;
  totalQuestions: number;
  coverage: number; // 0-1, share of the concept weights that were asked
  concepts: ConceptResult[];
}

/** Weight of one question: the harder it is, the more it is worth */
export const questionWeight = (difficulty: number): number => difficulty;

const round2 = (value: number): number => Math.round(value * 100) / 100;

/** Computes the concept scores and the final skill score */
export const scoreAssessment = (
  answers: AnsweredQuestion[],
  concepts: ConceptInfo[]
): ScoreResult => {
  const conceptById = new Map(concepts.map((concept) => [concept.id, concept]));

  // Group the answers by concept (a question without a concept goes to "General")
  const groups = new Map<number | null, AnsweredQuestion[]>();
  for (const answer of answers) {
    const key = answer.conceptId !== null && conceptById.has(answer.conceptId) ? answer.conceptId : null;
    groups.set(key, [...(groups.get(key) ?? []), answer]);
  }

  const results: ConceptResult[] = [];
  let weightedSum = 0;
  let weightTotal = 0;

  for (const [key, items] of groups) {
    const info = key === null ? null : conceptById.get(key) ?? null;
    const conceptWeight = info ? info.weight : 1;

    const earned = items.reduce((sum, item) => sum + (item.isCorrect ? questionWeight(item.difficulty) : 0), 0);
    const possible = items.reduce((sum, item) => sum + questionWeight(item.difficulty), 0);
    const score = possible === 0 ? 0 : (earned / possible) * 100;

    weightedSum += conceptWeight * score;
    weightTotal += conceptWeight;

    results.push({
      conceptId: key,
      name: info ? info.name : 'General',
      weight: Math.round(conceptWeight * 100),
      correct: items.filter((item) => item.isCorrect).length,
      total: items.length,
      score: Math.round(score),
    });
  }

  // Weakest concept first: it is the most useful thing to show the user
  results.sort((a, b) => a.score - b.score || a.name.localeCompare(b.name));

  const askedWeight = concepts
    .filter((concept) => groups.has(concept.id))
    .reduce((sum, concept) => sum + concept.weight, 0);

  return {
    finalScore: weightTotal === 0 ? 0 : Math.round(weightedSum / weightTotal),
    correctAnswers: answers.filter((answer) => answer.isCorrect).length,
    totalQuestions: answers.length,
    coverage: Math.min(1, askedWeight),
    concepts: results,
  };
};

/**
 * How much we trust the score, from 0 to 1:
 *  - coverage (50%): how much of the skill the questions touched
 *  - sample size (20%): how many questions were answered
 *  - consistency (30%): how many answers agree with the final score
 *    (above 50% we expect correct answers, otherwise wrong ones)
 */
export const computeConfidence = (
  answers: AnsweredQuestion[],
  finalScore: number,
  coverage: number
): number => {
  if (answers.length === 0) return 0;

  const sample = Math.min(1, answers.length / QUESTIONS_PER_ASSESSMENT);
  const expectCorrect = finalScore >= 50;
  const consistent = answers.filter((answer) => answer.isCorrect === expectCorrect).length;
  const consistency = consistent / answers.length;

  return round2(0.5 * coverage + 0.2 * sample + 0.3 * consistency);
};

/**
 * Skill state after an assessment (mastery and required are 0-1):
 *  - MASTERED: mastery reaches the requirement AND confidence is high enough
 *  - PRACTICING: close to the requirement (or high mastery with low confidence)
 *  - LEARNING: some knowledge, still far from the requirement
 *  - READY: nothing correct yet
 */
export const decideState = (mastery: number, required: number, confidence: number): SkillState => {
  if (mastery >= required && confidence >= MASTERED_CONFIDENCE) return 'MASTERED';
  if (mastery <= 0) return 'READY';
  if (mastery >= required || mastery / required >= PRACTICING_RATIO) return 'PRACTICING';
  return 'LEARNING';
};