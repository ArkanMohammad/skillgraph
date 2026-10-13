/**
 * Admin tools for users: look at one user's progress and delete a user.
 * Roles and the users list live in adminRoutes.ts; advice lives in adviceService.ts.
 */
import { query } from '../config/db';
import { getSkillStates } from './algorithm/recommendationEngine';
import { ProgressSummary } from './algorithm/progressSummary';
import { AdviceItem, listAdvice } from './adviceService';
import { RecentAssessment, getProgressOverview } from './progressService';
import { GoalInfo, getCurrentGoal, loadGoalGraphData } from './recommendationService';

/** A rule of the user tools was broken. The route turns it into an HTTP answer. */
export class AdminUserError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'AdminUserError';
    this.status = status;
  }
}

export interface UserSkillRow {
  id: number;
  name: string;
  category: string | null;
  state: string; // MASTERED, READY or LOCKED (same engine as the skill graph)
  mastery: number; // percent 0-100
  requiredMastery: number; // percent 0-100
}

export interface UserDetail {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  weeklyHours: number | null;
  currentGoal: GoalInfo | null;
  summary: ProgressSummary | null; // null when the user has no goal yet
  assessmentsCompleted: number;
  recentAssessments: RecentAssessment[];
  skills: UserSkillRow[];
  advice: AdviceItem[];
}

const toPercent = (value: number): number => Math.round(value * 100);

/** Everything the admin sees about one user */
export const getUserDetail = async (userId: string): Promise<UserDetail> => {
  const found = await query<{
    id: string;
    name: string;
    email: string;
    role: string;
    created_at: Date;
    weekly_hours: number | null;
  }>('SELECT id, name, email, role, created_at, weekly_hours FROM users WHERE id = $1', [userId]);
  const user = found.rows[0];
  if (!user) throw new AdminUserError(404, 'User not found');

  const goal = await getCurrentGoal(userId);
  const overview = goal ? await getProgressOverview(userId) : null;

  let skills: UserSkillRow[] = [];
  if (goal) {
    const data = await loadGoalGraphData(userId, goal.id);
    if (data) {
      const states = getSkillStates(data);
      skills = data.skills.map((skill) => ({
        id: skill.skillId,
        name: skill.name,
        category: skill.category,
        state: states.get(skill.skillId) ?? 'LOCKED',
        mastery: toPercent(data.progress.get(skill.skillId)?.mastery ?? 0),
        requiredMastery: toPercent(skill.requiredMastery),
      }));
    }
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: new Date(user.created_at).toISOString(),
    weeklyHours: user.weekly_hours,
    currentGoal: goal,
    summary: overview?.summary ?? null,
    assessmentsCompleted: overview?.assessmentsCompleted ?? 0,
    recentAssessments: overview?.recentAssessments ?? [],
    skills,
    advice: await listAdvice(userId),
  };
};

/**
 * Deletes a user with everything that belongs to them (goals, skills, assessments, advice).
 * An admin cannot delete themselves, and an admin account must be changed to USER first,
 * so the system can never end up without an admin by accident.
 */
export const deleteUser = async (adminId: string, userId: string): Promise<{ name: string; email: string }> => {
  if (userId === adminId) throw new AdminUserError(400, 'You cannot delete your own account here');

  const found = await query<{ name: string; email: string; role: string }>(
    'SELECT name, email, role FROM users WHERE id = $1',
    [userId]
  );
  const user = found.rows[0];
  if (!user) throw new AdminUserError(404, 'User not found');
  if (user.role === 'ADMIN') {
    throw new AdminUserError(409, 'This user is an admin. Change the role to USER before deleting the account');
  }

  // Every table that references users uses ON DELETE CASCADE
  await query('DELETE FROM users WHERE id = $1', [userId]);
  return { name: user.name, email: user.email };
};