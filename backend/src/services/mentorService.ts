/**
 * Mentors (PostgreSQL): users with the role MENTOR who look after the learners of a goal.
 *
 * - An admin gives the role MENTOR to a user and assigns the mentor to one or more goals.
 * - A learner can see the mentors of the goal they follow.
 * - When a user stops being a mentor, the goals they looked after are released.
 */
import { query } from '../config/db';
import { getCurrentGoal } from './recommendationService';

/** A rule of the mentor feature was broken. The route turns it into an HTTP answer. */
export class MentorError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'MentorError';
    this.status = status;
  }
}

export interface MentorGoal {
  id: number;
  name: string;
}

/** What an admin sees about a mentor */
export interface MentorSummary {
  id: string;
  name: string;
  email: string;
  goals: MentorGoal[];
}

/** What a learner sees about a mentor (no email) */
export interface PublicMentor {
  id: string;
  name: string;
}

export interface MyMentors {
  goal: MentorGoal;
  mentors: PublicMentor[];
}

/** Every mentor account with the goals they look after (mentors without a goal are included) */
export const listMentors = async (): Promise<MentorSummary[]> => {
  const mentors = await query<{ id: string; name: string; email: string }>(
    `SELECT id, name, email FROM users WHERE role = 'MENTOR' ORDER BY name, email`
  );
  const links = await query<{ mentor_id: string; goal_id: number; goal_name: string }>(
    `SELECT gm.mentor_id, g.id AS goal_id, g.name AS goal_name
     FROM goal_mentors gm
     JOIN goals g ON g.id = gm.goal_id
     JOIN users u ON u.id = gm.mentor_id AND u.role = 'MENTOR'
     ORDER BY g.id`
  );

  return mentors.rows.map((mentor) => ({
    id: mentor.id,
    name: mentor.name,
    email: mentor.email,
    goals: links.rows
      .filter((link) => link.mentor_id === mentor.id)
      .map((link) => ({ id: link.goal_id, name: link.goal_name })),
  }));
};

/** Assigns a mentor to a goal. Returns false when the mentor already looked after that goal. */
export const assignMentor = async (goalId: number, mentorId: string): Promise<boolean> => {
  const goal = await query('SELECT id FROM goals WHERE id = $1', [goalId]);
  if (goal.rowCount === 0) throw new MentorError(404, 'Goal not found');

  const user = await query<{ role: string }>('SELECT role FROM users WHERE id = $1', [mentorId]);
  if (user.rowCount === 0) throw new MentorError(404, 'User not found');
  if (user.rows[0].role !== 'MENTOR') {
    throw new MentorError(400, 'Only a user with the role MENTOR can be assigned to a goal');
  }

  const existing = await query('SELECT 1 FROM goal_mentors WHERE goal_id = $1 AND mentor_id = $2', [goalId, mentorId]);
  if ((existing.rowCount ?? 0) > 0) return false;

  await query('INSERT INTO goal_mentors (goal_id, mentor_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [goalId, mentorId]);
  return true;
};

/** Removes a mentor from a goal (the mentor account is not touched) */
export const removeMentor = async (goalId: number, mentorId: string): Promise<void> => {
  const removed = await query('DELETE FROM goal_mentors WHERE goal_id = $1 AND mentor_id = $2 RETURNING goal_id', [
    goalId,
    mentorId,
  ]);
  if (removed.rowCount === 0) throw new MentorError(404, 'This mentor is not assigned to that goal');
};

/** Releases every goal of a user (used when they stop being a mentor) */
export const clearMentorAssignments = async (userId: string): Promise<void> => {
  await query('DELETE FROM goal_mentors WHERE mentor_id = $1', [userId]);
};

/**
 * Changes the role of a user. A user who is not a MENTOR any more loses their goals,
 * so a learner never sees someone who is no longer a mentor. Returns null when the user does not exist.
 */
export const setUserRole = async (
  userId: string,
  role: string
): Promise<{ id: string; name: string; email: string; role: string } | null> => {
  const updated = await query<{ id: string; name: string; email: string; role: string }>(
    `UPDATE users SET role = $1, updated_at = NOW()
     WHERE id = $2
     RETURNING id, name, email, role`,
    [role, userId]
  );
  if (updated.rowCount === 0) return null;
  if (role !== 'MENTOR') await clearMentorAssignments(userId);
  return updated.rows[0];
};

/** The mentors of the goal the user follows right now */
export const getMyMentors = async (userId: string): Promise<MyMentors> => {
  const goal = await getCurrentGoal(userId);
  if (!goal) throw new MentorError(400, 'Select a goal first');

  const mentors = await query<{ id: string; name: string }>(
    `SELECT u.id, u.name
     FROM goal_mentors gm
     JOIN users u ON u.id = gm.mentor_id AND u.role = 'MENTOR'
     WHERE gm.goal_id = $1
     ORDER BY u.name`,
    [goal.id]
  );

  return { goal, mentors: mentors.rows };
};