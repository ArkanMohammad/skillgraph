/**
 * Progress queries (PostgreSQL) for the Progress page and the goal selection screen.
 *
 * Progress is stored per user and skill (user_skills), NOT per goal. When the user changes
 * the goal, the skills they share with the new goal already carry their mastery, so nothing
 * is copied or duplicated. progressForAllGoals() shows exactly that reuse.
 */
import { query } from '../config/db';
import { MASTERED_CONFIDENCE } from './algorithm/scoringService';
import { ProgressSummary, summarizeProgress } from './algorithm/progressSummary';
import { GoalInfo, getCurrentGoal, loadGoalGraphData } from './recommendationService';

export interface GoalProgress {
  goalId: number;
  name: string;
  totalSkills: number;
  masteredSkills: number;
  percent: number; // 0-100, importance weighted
}

export interface RecentAssessment {
  assessmentId: number;
  skillId: number;
  skillName: string;
  score: number; // 0-100
  completedAt: string;
}

export interface ProgressOverview {
  goal: GoalInfo;
  summary: ProgressSummary;
  assessmentsCompleted: number;
  recentAssessments: RecentAssessment[];
}

/**
 * Progress of the user in EVERY goal with one query.
 * A goal that shares skills with the current one starts above 0% automatically.
 */
export const progressForAllGoals = async (userId: string): Promise<GoalProgress[]> => {
  const result = await query<{
    goal_id: number;
    name: string;
    total_skills: number;
    mastered_skills: number;
    percent: number | null;
  }>(
    `SELECT g.id AS goal_id,
            g.name,
            COUNT(gs.skill_id)::int AS total_skills,
            (COUNT(*) FILTER (
               WHERE COALESCE(us.proficiency_level, 0) >= gs.required_proficiency
                 AND COALESCE(us.confidence, 0) >= $2
            ))::int AS mastered_skills,
            ROUND(
              100 * SUM(gs.importance * LEAST(COALESCE(us.proficiency_level, 0) / NULLIF(gs.required_proficiency, 0), 1))
              / NULLIF(SUM(gs.importance), 0)
            )::int AS percent
     FROM goals g
     JOIN goal_skills gs ON gs.goal_id = g.id
     LEFT JOIN user_skills us ON us.skill_id = gs.skill_id AND us.user_id = $1
     GROUP BY g.id, g.name
     ORDER BY g.id`,
    [userId, MASTERED_CONFIDENCE]
  );

  return result.rows.map((row) => ({
    goalId: row.goal_id,
    name: row.name,
    totalSkills: row.total_skills,
    masteredSkills: row.mastered_skills,
    percent: row.percent ?? 0,
  }));
};

/** The last finished assessments of the user, newest first */
export const recentAssessments = async (userId: string, limit = 5): Promise<RecentAssessment[]> => {
  const result = await query<{
    id: number;
    skill_id: number;
    skill_name: string;
    final_score: string | number;
    completed_at: Date;
  }>(
    `SELECT a.id, a.skill_id, s.name AS skill_name, a.final_score, a.completed_at
     FROM assessments a
     JOIN skills s ON s.id = a.skill_id
     WHERE a.user_id = $1 AND a.completed_at IS NOT NULL AND a.final_score IS NOT NULL
     ORDER BY a.completed_at DESC
     LIMIT $2`,
    [userId, limit]
  );

  return result.rows.map((row) => ({
    assessmentId: row.id,
    skillId: row.skill_id,
    skillName: row.skill_name,
    score: Math.round(Number(row.final_score)),
    completedAt: new Date(row.completed_at).toISOString(),
  }));
};

/** Number of finished assessments of the user */
const countCompletedAssessments = async (userId: string): Promise<number> => {
  const result = await query<{ total: number }>(
    'SELECT COUNT(*)::int AS total FROM assessments WHERE user_id = $1 AND completed_at IS NOT NULL',
    [userId]
  );
  return result.rows[0].total;
};

/** Everything the Progress page shows for the current goal (null when no goal is selected) */
export const getProgressOverview = async (userId: string): Promise<ProgressOverview | null> => {
  const goal = await getCurrentGoal(userId);
  if (!goal) return null;

  const data = await loadGoalGraphData(userId, goal.id);
  if (!data) return null;

  const [recent, completed] = await Promise.all([
    recentAssessments(userId),
    countCompletedAssessments(userId),
  ]);

  return {
    goal,
    summary: summarizeProgress(data),
    assessmentsCompleted: completed,
    recentAssessments: recent,
  };
};