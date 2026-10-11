/**
 * Loads the data the recommendation engine needs from PostgreSQL.
 * The engine itself (services/algorithm/recommendationEngine.ts) never touches the database.
 */
import { query } from '../config/db';
import {
  GoalGraphData,
  GoalSkillNode,
  GraphEdge,
  Recommendation,
  UserProgress,
  getNextBestSkill,
} from './algorithm/recommendationEngine';

/** An error that carries the HTTP status code the route should answer with */
export class RecommendationError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export interface GoalInfo {
  id: number;
  name: string;
}

const toNum = (value: string | number): number => Number(value);

/** Goal with its skills, prerequisite edges and the user's progress (3 queries) */
export const loadGoalGraphData = async (
  userId: string,
  goalId: number
): Promise<GoalGraphData | null> => {
  const goal = await query('SELECT id FROM goals WHERE id = $1', [goalId]);
  if (goal.rowCount === 0) return null;

  const skillRows = await query<{
    id: number;
    name: string;
    category: string | null;
    required_proficiency: string | number;
    importance: string | number;
    estimated_hours: number;
  }>(
    `SELECT s.id, s.name, s.category, gs.required_proficiency, gs.importance, gs.estimated_hours
     FROM goal_skills gs
     JOIN skills s ON s.id = gs.skill_id
     WHERE gs.goal_id = $1
     ORDER BY s.id`,
    [goalId]
  );

  // Only prerequisites that belong to the same goal count
  const edgeRows = await query<{ skill_id: number; prerequisite_skill_id: number }>(
    `SELECT sd.skill_id, sd.prerequisite_skill_id
     FROM skill_dependencies sd
     WHERE sd.skill_id IN (SELECT skill_id FROM goal_skills WHERE goal_id = $1)
       AND sd.prerequisite_skill_id IN (SELECT skill_id FROM goal_skills WHERE goal_id = $1)`,
    [goalId]
  );

  // Progress is stored per user and skill, so it is reused when the goal changes
  const progressRows = await query<{
    skill_id: number;
    proficiency_level: string | number;
    confidence: string | number;
  }>(
    `SELECT us.skill_id, us.proficiency_level, us.confidence
     FROM user_skills us
     WHERE us.user_id = $1
       AND us.skill_id IN (SELECT skill_id FROM goal_skills WHERE goal_id = $2)`,
    [userId, goalId]
  );

  const skills: GoalSkillNode[] = skillRows.rows.map((row) => ({
    skillId: row.id,
    name: row.name,
    category: row.category,
    requiredMastery: toNum(row.required_proficiency),
    importance: toNum(row.importance),
    estimatedHours: row.estimated_hours,
  }));

  const edges: GraphEdge[] = edgeRows.rows.map((row) => ({
    skillId: row.skill_id,
    prerequisiteId: row.prerequisite_skill_id,
  }));

  const progress = new Map<number, UserProgress>();
  for (const row of progressRows.rows) {
    progress.set(row.skill_id, {
      mastery: toNum(row.proficiency_level),
      confidence: toNum(row.confidence),
    });
  }

  return { skills, edges, progress };
};

/** The goal the user is working on right now, or null */
export const getCurrentGoal = async (userId: string): Promise<GoalInfo | null> => {
  const result = await query<GoalInfo>(
    `SELECT g.id, g.name
     FROM user_goals ug
     JOIN goals g ON g.id = ug.goal_id
     WHERE ug.user_id = $1 AND ug.is_current = TRUE
     LIMIT 1`,
    [userId]
  );
  return result.rows[0] ?? null;
};

/** Next Best Skill for the user's current goal (recalculated from the latest data every time) */
export const recommendNextSkill = async (
  userId: string
): Promise<Recommendation & { goal: GoalInfo }> => {
  const goal = await getCurrentGoal(userId);
  if (!goal) throw new RecommendationError(400, 'Select a goal first');

  const data = await loadGoalGraphData(userId, goal.id);
  if (!data) throw new RecommendationError(404, 'Goal not found');
  if (data.skills.length === 0) throw new RecommendationError(400, 'This goal has no skills yet');

  return { goal, ...getNextBestSkill(data) };
};