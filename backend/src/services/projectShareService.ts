/**
 * Project shares and mentor recommendations (PostgreSQL).
 *
 * - A learner shares a project with a mentor who looks after the goal the learner follows.
 * - The mentor either writes a signed personal recommendation or declines.
 * - A recommendation is the opinion of one person. It is NOT an official certificate.
 * - The signature is a PNG drawn on the signature pad, stored as a data URL.
 */
import crypto from 'node:crypto';
import type { PoolClient } from 'pg';
import { pool, query } from '../config/db';
import { getCurrentGoal } from './recommendationService';

export const MAX_PENDING_SHARES = 5;
export const MIN_TITLE = 3;
export const MAX_TITLE = 120;
export const MIN_DESCRIPTION = 20;
export const MAX_DESCRIPTION = 2000;
export const MAX_URL = 500;
export const MIN_BODY = 50;
export const MAX_BODY = 2000;
export const MAX_MENTOR_TITLE = 80;
export const MAX_NOTE = 300;
/** Keeps the request under the 100 kb limit of express.json() */
export const MAX_SIGNATURE_LENGTH = 80000;
const MIN_SIGNATURE_BYTES = 100;

const SIGNATURE_PREFIX = 'data:image/png;base64,';
const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const BASE64_PATTERN = /^[A-Za-z0-9+/]+={0,2}$/;
// No 0, O, 1, I or L, so a code is easy to read aloud and to type
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

/** A rule of this feature was broken. The route turns it into an HTTP answer. */
export class ProjectShareError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ProjectShareError';
    this.status = status;
  }
}

export type ShareStatus = 'PENDING' | 'RECOMMENDED' | 'DECLINED';

export interface ShareInput {
  mentorId: string;
  title: string;
  description: string;
  projectUrl: string | null;
}

export interface RecommendationInput {
  body: string;
  mentorTitle: string;
  signature: string;
}

/** The recommendation as the learner (and later the PDF) sees it */
export interface RecommendationItem {
  code: string;
  mentorName: string;
  mentorTitle: string;
  body: string;
  signature: string;
  issuedAt: string;
}

/** One project of the learner */
export interface MyShare {
  id: number;
  title: string;
  description: string;
  projectUrl: string | null;
  goalName: string;
  mentorName: string | null; // null when the mentor account no longer exists
  status: ShareStatus;
  declineNote: string | null;
  createdAt: string;
  decidedAt: string | null;
  recommendation: RecommendationItem | null;
}

/** One request waiting (or answered) on the desk of a mentor */
export interface MentorRequest {
  id: number;
  learnerName: string;
  goalName: string;
  title: string;
  description: string;
  projectUrl: string | null;
  status: ShareStatus;
  declineNote: string | null;
  createdAt: string;
  decidedAt: string | null;
  code: string | null; // the code of the recommendation, once it is written
}

const toIso = (value: Date | string | null): string | null => (value === null ? null : new Date(value).toISOString());

const textField = (body: unknown, name: string): string => {
  const raw = (body as Record<string, unknown> | null)?.[name];
  return typeof raw === 'string' ? raw.trim() : '';
};

/** A web address must start with http:// or https:// (nothing else is ever linked) */
const isWebUrl = (value: string): boolean => {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

/** Checks the form of a new share. Returns the cleaned values. The link to the project is required. */
export const parseShareInput = (body: unknown): ShareInput => {
  const mentorId = textField(body, 'mentorId');
  const title = textField(body, 'title');
  const description = textField(body, 'description');
  const projectUrl = textField(body, 'projectUrl');

  if (!mentorId) throw new ProjectShareError(400, 'Choose a mentor');
  if (title.length < MIN_TITLE || title.length > MAX_TITLE) {
    throw new ProjectShareError(400, `The title must be ${MIN_TITLE} to ${MAX_TITLE} characters`);
  }
  if (description.length < MIN_DESCRIPTION || description.length > MAX_DESCRIPTION) {
    throw new ProjectShareError(400, `The description must be ${MIN_DESCRIPTION} to ${MAX_DESCRIPTION} characters`);
  }
  if (!projectUrl) throw new ProjectShareError(400, 'Add a link to the project');
  if (projectUrl.length > MAX_URL || !isWebUrl(projectUrl)) {
    throw new ProjectShareError(400, 'The project link must be a web address that starts with http:// or https://');
  }
  return { mentorId, title, description, projectUrl };
};

/** Checks the signature: a PNG data URL of a reasonable size */
export const checkSignature = (signature: string): void => {
  if (!signature.startsWith(SIGNATURE_PREFIX)) throw new ProjectShareError(400, 'Draw your signature first');
  if (signature.length > MAX_SIGNATURE_LENGTH) {
    throw new ProjectShareError(400, 'The signature is too detailed. Clear it and draw it again with fewer strokes');
  }
  const data = signature.slice(SIGNATURE_PREFIX.length);
  if (!BASE64_PATTERN.test(data)) throw new ProjectShareError(400, 'The signature is not a valid image');
  const bytes = Buffer.from(data, 'base64');
  if (bytes.length < MIN_SIGNATURE_BYTES || !bytes.subarray(0, PNG_MAGIC.length).equals(PNG_MAGIC)) {
    throw new ProjectShareError(400, 'The signature is not a valid image');
  }
};

/** Checks the recommendation form. Returns the cleaned values. */
export const parseRecommendationInput = (body: unknown): RecommendationInput => {
  const text = textField(body, 'body');
  const mentorTitle = textField(body, 'mentorTitle');
  const signature = textField(body, 'signature');

  if (text.length < MIN_BODY || text.length > MAX_BODY) {
    throw new ProjectShareError(400, `The recommendation must be ${MIN_BODY} to ${MAX_BODY} characters`);
  }
  if (mentorTitle.length < 2 || mentorTitle.length > MAX_MENTOR_TITLE) {
    throw new ProjectShareError(400, `Your title must be 2 to ${MAX_MENTOR_TITLE} characters`);
  }
  checkSignature(signature);
  return { body: text, mentorTitle, signature };
};

/** A new verification code such as SG-7KQ2-M9XD-4TPA */
export const generateCode = (): string => {
  const pick = (): string => CODE_ALPHABET[crypto.randomInt(CODE_ALPHABET.length)];
  const group = (): string => Array.from({ length: 4 }, pick).join('');
  return `SG-${group()}-${group()}-${group()}`;
};

// ---------- Learner side ----------

/** Shares a project with a mentor of the goal the learner follows */
export const createShare = async (learnerId: string, input: ShareInput): Promise<number> => {
  const goal = await getCurrentGoal(learnerId);
  if (!goal) throw new ProjectShareError(400, 'Select a goal first');

  const mentor = await query(
    `SELECT 1
     FROM goal_mentors gm
     JOIN users u ON u.id = gm.mentor_id AND u.role = 'MENTOR'
     WHERE gm.goal_id = $1 AND gm.mentor_id = $2`,
    [goal.id, input.mentorId]
  );
  if (mentor.rowCount === 0) throw new ProjectShareError(400, 'This person is not a mentor of your goal');

  const pending = await query<{ count: string }>(
    `SELECT COUNT(*) AS count FROM project_shares WHERE learner_id = $1 AND status = 'PENDING'`,
    [learnerId]
  );
  if (Number(pending.rows[0].count) >= MAX_PENDING_SHARES) {
    throw new ProjectShareError(400, `You can have at most ${MAX_PENDING_SHARES} projects waiting for an answer`);
  }

  const created = await query<{ id: number }>(
    `INSERT INTO project_shares (learner_id, mentor_id, goal_id, title, description, project_url)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id`,
    [learnerId, input.mentorId, goal.id, input.title, input.description, input.projectUrl]
  );
  return created.rows[0].id;
};

interface MyShareRow {
  id: number;
  title: string;
  description: string;
  project_url: string | null;
  goal_name: string;
  mentor_name: string | null;
  status: ShareStatus;
  decline_note: string | null;
  created_at: Date;
  decided_at: Date | null;
  code: string | null;
  r_mentor_name: string | null;
  r_mentor_title: string | null;
  r_body: string | null;
  r_signature: string | null;
  r_issued_at: Date | null;
}

/** Every project of the learner, newest first, with the recommendation when there is one */
export const listMyShares = async (learnerId: string): Promise<MyShare[]> => {
  const result = await query<MyShareRow>(
    `SELECT s.id, s.title, s.description, s.project_url, g.name AS goal_name, u.name AS mentor_name,
            s.status, s.decline_note, s.created_at, s.decided_at,
            r.code, r.mentor_name AS r_mentor_name, r.mentor_title AS r_mentor_title,
            r.body AS r_body, r.signature AS r_signature, r.issued_at AS r_issued_at
     FROM project_shares s
     JOIN goals g ON g.id = s.goal_id
     LEFT JOIN users u ON u.id = s.mentor_id
     LEFT JOIN recommendations r ON r.share_id = s.id
     WHERE s.learner_id = $1
     ORDER BY s.created_at DESC, s.id DESC`,
    [learnerId]
  );

  return result.rows.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    projectUrl: row.project_url,
    goalName: row.goal_name,
    mentorName: row.r_mentor_name ?? row.mentor_name,
    status: row.status,
    declineNote: row.decline_note,
    createdAt: toIso(row.created_at) as string,
    decidedAt: toIso(row.decided_at),
    recommendation:
      row.code && row.r_body && row.r_signature && row.r_mentor_name && row.r_mentor_title && row.r_issued_at
        ? {
            code: row.code,
            mentorName: row.r_mentor_name,
            mentorTitle: row.r_mentor_title,
            body: row.r_body,
            signature: row.r_signature,
            issuedAt: toIso(row.r_issued_at) as string,
          }
        : null,
  }));
};

/** The learner takes back a project that is still waiting or was declined (an issued recommendation stays) */
export const cancelShare = async (learnerId: string, shareId: number): Promise<void> => {
  const share = await query<{ status: ShareStatus }>(
    'SELECT status FROM project_shares WHERE id = $1 AND learner_id = $2',
    [shareId, learnerId]
  );
  if (share.rowCount === 0) throw new ProjectShareError(404, 'Project not found');
  if (share.rows[0].status === 'RECOMMENDED') {
    throw new ProjectShareError(400, 'A project with a recommendation cannot be removed');
  }
  await query('DELETE FROM project_shares WHERE id = $1 AND learner_id = $2', [shareId, learnerId]);
};

// ---------- Mentor side ----------

/** The role is read from the database, because the one in the login token can be old */
const assertMentor = async (userId: string): Promise<{ name: string }> => {
  const user = await query<{ name: string; role: string }>('SELECT name, role FROM users WHERE id = $1', [userId]);
  if (user.rowCount === 0 || user.rows[0].role !== 'MENTOR') {
    throw new ProjectShareError(403, 'Only a mentor can do this');
  }
  return { name: user.rows[0].name };
};

interface RequestRow {
  id: number;
  learner_name: string;
  goal_name: string;
  title: string;
  description: string;
  project_url: string | null;
  status: ShareStatus;
  decline_note: string | null;
  created_at: Date;
  decided_at: Date | null;
  code: string | null;
}

/** The projects shared with this mentor: waiting ones first, then the answered ones */
export const listRequests = async (mentorId: string): Promise<MentorRequest[]> => {
  await assertMentor(mentorId);
  const result = await query<RequestRow>(
    `SELECT s.id, l.name AS learner_name, g.name AS goal_name, s.title, s.description, s.project_url,
            s.status, s.decline_note, s.created_at, s.decided_at, r.code
     FROM project_shares s
     JOIN users l ON l.id = s.learner_id
     JOIN goals g ON g.id = s.goal_id
     LEFT JOIN recommendations r ON r.share_id = s.id
     WHERE s.mentor_id = $1
     ORDER BY (s.status = 'PENDING') DESC, s.created_at DESC, s.id DESC`,
    [mentorId]
  );

  return result.rows.map((row) => ({
    id: row.id,
    learnerName: row.learner_name,
    goalName: row.goal_name,
    title: row.title,
    description: row.description,
    projectUrl: row.project_url,
    status: row.status,
    declineNote: row.decline_note,
    createdAt: toIso(row.created_at) as string,
    decidedAt: toIso(row.decided_at),
    code: row.code,
  }));
};

/** Locks one waiting request of this mentor inside a transaction */
const lockPendingShare = async (client: PoolClient, mentorId: string, shareId: number): Promise<void> => {
  const share = await client.query<{ status: ShareStatus }>(
    'SELECT status FROM project_shares WHERE id = $1 AND mentor_id = $2 FOR UPDATE',
    [shareId, mentorId]
  );
  if (share.rowCount === 0) throw new ProjectShareError(404, 'Request not found');
  if (share.rows[0].status !== 'PENDING') throw new ProjectShareError(409, 'This request was already answered');
};

/** The mentor writes and signs a recommendation. Returns its verification code. */
export const writeRecommendation = async (
  mentorId: string,
  shareId: number,
  input: RecommendationInput
): Promise<string> => {
  const mentor = await assertMentor(mentorId);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await lockPendingShare(client, mentorId, shareId);

    let code = generateCode();
    for (let attempt = 0; ; attempt += 1) {
      const clash = await client.query('SELECT 1 FROM recommendations WHERE code = $1', [code]);
      if (clash.rowCount === 0) break;
      if (attempt >= 5) throw new Error('Could not create a unique code');
      code = generateCode();
    }

    await client.query(
      `INSERT INTO recommendations (share_id, mentor_name, mentor_title, body, signature, code)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [shareId, mentor.name, input.mentorTitle, input.body, input.signature, code]
    );
    await client.query(`UPDATE project_shares SET status = 'RECOMMENDED', decided_at = NOW() WHERE id = $1`, [shareId]);
    await client.query('COMMIT');
    return code;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

/** The mentor declines a request, with an optional short note for the learner */
export const declineRequest = async (mentorId: string, shareId: number, body: unknown): Promise<void> => {
  await assertMentor(mentorId);
  const note = textField(body, 'note');
  if (note.length > MAX_NOTE) throw new ProjectShareError(400, `The note must be at most ${MAX_NOTE} characters`);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await lockPendingShare(client, mentorId, shareId);
    await client.query(
      `UPDATE project_shares SET status = 'DECLINED', decline_note = $2, decided_at = NOW() WHERE id = $1`,
      [shareId, note || null]
    );
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};