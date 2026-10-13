/**
 * Advice: short messages that an admin writes for a user (table user_advice).
 * The admin creates them; the user reads them on the dashboard and can mark them as read.
 */
import { query } from '../config/db';

export const MAX_ADVICE_LENGTH = 1000;
const DEFAULT_LIMIT = 10;

/** A rule of the advice feature was broken. The route turns it into an HTTP answer. */
export class AdviceError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'AdviceError';
    this.status = status;
  }
}

export interface AdviceItem {
  id: number;
  message: string;
  createdAt: string;
  readAt: string | null;
  adminName: string | null; // null when that admin account no longer exists
}

interface AdviceRow {
  id: number;
  message: string;
  created_at: Date;
  read_at: Date | null;
  admin_name: string | null;
}

const toItem = (row: AdviceRow): AdviceItem => ({
  id: row.id,
  message: row.message,
  createdAt: new Date(row.created_at).toISOString(),
  readAt: row.read_at === null ? null : new Date(row.read_at).toISOString(),
  adminName: row.admin_name,
});

/** Checks the text of an advice (1 to 1000 characters). Returns the cleaned text. */
export const parseAdviceInput = (body: unknown): string => {
  const raw = (body as { message?: unknown } | null)?.message;
  const message = typeof raw === 'string' ? raw.trim() : '';
  if (message.length < 1) throw new AdviceError(400, 'The advice cannot be empty');
  if (message.length > MAX_ADVICE_LENGTH) {
    throw new AdviceError(400, `The advice must be at most ${MAX_ADVICE_LENGTH} characters`);
  }
  return message;
};

/** Saves an advice from an admin for a user */
export const createAdvice = async (adminId: string, userId: string, message: string): Promise<AdviceItem> => {
  const user = await query('SELECT id FROM users WHERE id = $1', [userId]);
  if (user.rowCount === 0) throw new AdviceError(404, 'User not found');

  const inserted = await query<{ id: number }>(
    `INSERT INTO user_advice (user_id, admin_id, message)
     VALUES ($1, $2, $3)
     RETURNING id`,
    [userId, adminId, message]
  );

  const created = await query<AdviceRow>(
    `SELECT a.id, a.message, a.created_at, a.read_at, u.name AS admin_name
     FROM user_advice a
     LEFT JOIN users u ON u.id = a.admin_id
     WHERE a.id = $1`,
    [inserted.rows[0].id]
  );
  return toItem(created.rows[0]);
};

/** Newest advice of one user first */
export const listAdvice = async (userId: string, limit = DEFAULT_LIMIT): Promise<AdviceItem[]> => {
  const result = await query<AdviceRow>(
    `SELECT a.id, a.message, a.created_at, a.read_at, u.name AS admin_name
     FROM user_advice a
     LEFT JOIN users u ON u.id = a.admin_id
     WHERE a.user_id = $1
     ORDER BY a.created_at DESC, a.id DESC
     LIMIT $2`,
    [userId, limit]
  );
  return result.rows.map(toItem);
};

/** How many advice messages the user has not read yet */
export const countUnreadAdvice = async (userId: string): Promise<number> => {
  const result = await query<{ total: number }>(
    'SELECT COUNT(*)::int AS total FROM user_advice WHERE user_id = $1 AND read_at IS NULL',
    [userId]
  );
  return result.rows[0].total;
};

/** The user marks one of their own advice messages as read (other users' advice is never touched) */
export const markAdviceRead = async (userId: string, adviceId: number): Promise<void> => {
  const updated = await query(
    `UPDATE user_advice SET read_at = COALESCE(read_at, NOW())
     WHERE id = $1 AND user_id = $2
     RETURNING id`,
    [adviceId, userId]
  );
  if (updated.rows.length === 0) throw new AdviceError(404, 'Advice not found');
};

/** The user marks all their unread advice as read. Returns how many messages changed. */
export const markAllAdviceRead = async (userId: string): Promise<number> => {
  const updated = await query(
    `UPDATE user_advice SET read_at = NOW()
     WHERE user_id = $1 AND read_at IS NULL
     RETURNING id`,
    [userId]
  );
  return updated.rows.length;
};