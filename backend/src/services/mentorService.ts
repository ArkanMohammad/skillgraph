/**
 * Mentors (PostgreSQL): users with the role MENTOR who look after the learners of a goal.
 *
 * - An admin gives the role MENTOR to a user and assigns the mentor to one or more goals.
 * - An admin can also create a brand new mentor account directly (name, email, first password).
 * - A learner can see the mentors of the goal they follow.
 * - When a user stops being a mentor, the goals they looked after are released.
 */
import bcrypt from 'bcrypt';
import { pool, query } from '../config/db';
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

const SALT_ROUNDS = 10; // Same bcrypt cost as the register route
export const MAX_NAME_LENGTH = 100; // Same size as users.name
export const MAX_EMAIL_LENGTH = 255; // Same size as users.email
export const MIN_MENTOR_PASSWORD = 8;
export const MAX_MENTOR_PASSWORD = 72; // bcrypt ignores everything after 72 bytes
export const MAX_START_GOALS = 20;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Simple check: something@something.something

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
 * Changes the role of a user. A user who is not a MENTOR any more loses their goals and the
 * projects that were still waiting for them, so a learner never waits for someone who cannot answer.
 * Returns null when the user does not exist.
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
  if (role !== 'MENTOR') {
    await clearMentorAssignments(userId);
    await query(`UPDATE project_shares SET mentor_id = NULL WHERE mentor_id = $1 AND status = 'PENDING'`, [userId]);
  }
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

export interface NewMentorInput {
  name: string;
  email: string;
  password: string;
  goalIds: number[];
}

/** Cleans and checks the form of "Add mentor" (name, email, first password and optional goals) */
export const parseNewMentorInput = (body: unknown): NewMentorInput => {
  const data = (body ?? {}) as Record<string, unknown>;
  const name = typeof data.name === 'string' ? data.name.trim() : '';
  const email = typeof data.email === 'string' ? data.email.trim().toLowerCase() : '';
  const password = typeof data.password === 'string' ? data.password : '';

  if (name.length < 1 || name.length > MAX_NAME_LENGTH) {
    throw new MentorError(400, `The name must be between 1 and ${MAX_NAME_LENGTH} characters`);
  }
  if (!EMAIL_PATTERN.test(email) || email.length > MAX_EMAIL_LENGTH) {
    throw new MentorError(400, 'Enter a valid email address');
  }
  if (password.length < MIN_MENTOR_PASSWORD || password.length > MAX_MENTOR_PASSWORD) {
    throw new MentorError(
      400,
      `The password must be between ${MIN_MENTOR_PASSWORD} and ${MAX_MENTOR_PASSWORD} characters`
    );
  }

  const rawGoals = data.goalIds ?? [];
  if (!Array.isArray(rawGoals) || rawGoals.length > MAX_START_GOALS) {
    throw new MentorError(400, `goalIds must be a list of at most ${MAX_START_GOALS} goals`);
  }
  const goalIds: number[] = [];
  for (const raw of rawGoals) {
    const id = Number(raw);
    if (!Number.isInteger(id) || id < 1) throw new MentorError(400, 'goalIds must be positive integers');
    if (!goalIds.includes(id)) goalIds.push(id);
  }

  return { name, email, password, goalIds };
};

/**
 * Creates a new account with the role MENTOR (and the goals it looks after) in one transaction.
 * The admin tells the mentor the first password, and the mentor can change it in the profile page.
 */
export const createMentorAccount = async (input: NewMentorInput): Promise<MentorSummary> => {
  const taken = await query('SELECT 1 FROM users WHERE email = $1', [input.email]);
  if ((taken.rowCount ?? 0) > 0) {
    throw new MentorError(
      409,
      'This email is already registered. To make an existing user a mentor, change their role in the Overview tab.'
    );
  }

  const goals: MentorGoal[] = [];
  for (const goalId of input.goalIds) {
    const goal = await query<{ id: number; name: string }>('SELECT id, name FROM goals WHERE id = $1', [goalId]);
    if (goal.rowCount === 0) throw new MentorError(404, 'Goal not found');
    goals.push(goal.rows[0]);
  }

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const created = await client.query<{ id: string }>(
      `INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, 'MENTOR') RETURNING id`,
      [input.name, input.email, passwordHash]
    );
    const mentorId = created.rows[0].id;
    for (const goal of goals) {
      await client.query('INSERT INTO goal_mentors (goal_id, mentor_id) VALUES ($1, $2)', [goal.id, mentorId]);
    }
    await client.query('COMMIT');
    return { id: mentorId, name: input.name, email: input.email, goals };
  } catch (err) {
    await client.query('ROLLBACK');
    // Two admins used the same email at the same moment
    if ((err as { code?: string }).code === '23505') {
      throw new MentorError(409, 'This email is already registered.');
    }
    throw err;
  } finally {
    client.release();
  }
};