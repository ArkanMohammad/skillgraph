/**
 * Shapes of the seed data (skills, concepts, questions)
 * أشكال بيانات الـ seed: المهارات والمفاهيم والأسئلة
 */

/** 1 = easy, 2 = medium, 3 = hard / 1 سهل، 2 متوسط، 3 صعب */
export type SeedDifficulty = 1 | 2 | 3;

/**
 * One question written as a short tuple:
 * [conceptIndex, difficulty, prompt, correctAnswer, [wrong1, wrong2, wrong3]]
 * The position of the correct option is shuffled when seeding (always the same shuffle).
 */
export type QuestionTuple = [
  conceptIndex: number,
  difficulty: SeedDifficulty,
  prompt: string,
  correct: string,
  wrong: [string, string, string]
];

/** All concepts and questions of one skill / مفاهيم وأسئلة مهارة واحدة */
export interface SkillQuestions {
  skill: string;
  /** [concept name, weight]: the weights of a skill must add up to 1 */
  concepts: [string, number][];
  questions: QuestionTuple[];
}

export interface SeedSkill {
  name: string;
  category: string;
  description: string;
  hours: number; // Estimated learning hours / ساعات التعلم المقدّرة
}

/** [skill name, required mastery 0-1, importance 0-1] / [المهارة، شرط التمكن، الأهمية] */
export type GoalSkillTuple = [skill: string, required: number, importance: number];