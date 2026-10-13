/**
 * Review queue (PostgreSQL): which mastered skills of the current goal start to fade from memory.
 *
 * Only skills the user has really mastered are listed (enough mastery AND confidence, and a
 * known test date). The decay maths lives in algorithm/knowledgeDecay.ts; this file only loads
 * the data and sorts the result: the skill that is forgotten the most comes first.
 * A review is simply a new test of the skill, which restarts its curve.
 */
import { query } from '../config/db';
import { MASTERED_CONFIDENCE } from './algorithm/scoringService';
import { MemoryHealth, memoryHealth } from './algorithm/knowledgeDecay';
import { GoalInfo, RecommendationError, getCurrentGoal } from './recommendationService';

export interface ReviewItem extends MemoryHealth {
  skillId: number;
  skillName: string;
  category: string | null;
  mastery: number; // 0-100, stored mastery
  requiredMastery: number; // 0-100
  lastAssessedAt: string;
}

export interface ReviewQueue {
  goal: GoalInfo;
  items: ReviewItem[]; // most forgotten first
  dueCount: number;
  fadingCount: number;
  freshCount: number;
  nextReviewAt: string | null; // earliest upcoming review date of the skills that are not due yet
}

const toNum = (value: string | number): number => Number(value);

/** Memory health of every mastered skill of the current goal (`now` can be set for tests) */
export const getReviewQueue = async (userId: string, now: Date = new Date()): Promise<ReviewQueue> => {
  const goal = await getCurrentGoal(userId);
  if (!goal) throw new RecommendationError(400, 'Select a goal first');

  const result = await query<{
    skill_id: number;
    name: string;
    category: string | null;
    required_proficiency: string | number;
    proficiency_level: string | number;
    confidence: string | number;
    last_assessed_at: Date;
  }>(
    `SELECT s.id AS skill_id, s.name, s.category, gs.required_proficiency,
            us.proficiency_level, us.confidence, us.last_assessed_at
     FROM goal_skills gs
     JOIN skills s ON s.id = gs.skill_id
     JOIN user_skills us ON us.skill_id = gs.skill_id AND us.user_id = $1
     WHERE gs.goal_id = $2
       AND us.last_assessed_at IS NOT NULL
       AND us.proficiency_level >= gs.required_proficiency
       AND us.confidence >= $3`,
    [userId, goal.id, MASTERED_CONFIDENCE]
  );

  const items: ReviewItem[] = result.rows.map((row) => {
    const lastAssessed = new Date(row.last_assessed_at);
    const health = memoryHealth(
      {
        mastery: toNum(row.proficiency_level),
        confidence: toNum(row.confidence),
        lastAssessedAt: lastAssessed,
      },
      now
    );
    return {
      skillId: row.skill_id,
      skillName: row.name,
      category: row.category,
      mastery: Math.round(toNum(row.proficiency_level) * 100),
      requiredMastery: Math.round(toNum(row.required_proficiency) * 100),
      lastAssessedAt: lastAssessed.toISOString(),
      ...health,
    };
  });

  // The most forgotten skill first; equal retention is ordered by name so the list is stable
  items.sort((a, b) => a.retention - b.retention || a.skillName.localeCompare(b.skillName));

  const upcoming = items
    .filter((item) => item.status !== 'DUE')
    .map((item) => item.nextReviewAt)
    .sort();

  return {
    goal,
    items,
    dueCount: items.filter((item) => item.status === 'DUE').length,
    fadingCount: items.filter((item) => item.status === 'FADING').length,
    freshCount: items.filter((item) => item.status === 'FRESH').length,
    nextReviewAt: upcoming[0] ?? null,
  };
};