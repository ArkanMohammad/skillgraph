/**
 * Public check of a recommendation code (PostgreSQL).
 * Anybody who has a code can see the recommendation behind it, so an employer can check that a
 * recommendation is real. Only what is printed on the paper is returned: no email and no
 * description of the project.
 */
import { query } from '../config/db';
import { ProjectShareError } from './projectShareService';

const CODE_PATTERN = /^SG-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

export interface VerifiedRecommendation {
  code: string;
  projectTitle: string;
  learnerName: string;
  goalName: string;
  mentorName: string;
  mentorTitle: string;
  body: string;
  signature: string;
  issuedAt: string;
}

/** Turns what was typed ("sg-7kq2 m9xd 4tpa") into the stored form ("SG-7KQ2-M9XD-4TPA") */
export const normalizeCode = (raw: unknown): string => {
  const text = typeof raw === 'string' ? raw.trim().toUpperCase() : '';
  const compact = text.replace(/[^A-Z0-9]/g, '');
  if (compact.length !== 14 || !compact.startsWith('SG')) return text;
  return `SG-${compact.slice(2, 6)}-${compact.slice(6, 10)}-${compact.slice(10, 14)}`;
};

/** Checks a code. Throws 400 for a code that cannot exist and 404 for an unknown one. */
export const verifyRecommendation = async (rawCode: unknown): Promise<VerifiedRecommendation> => {
  const code = normalizeCode(rawCode);
  if (!CODE_PATTERN.test(code)) {
    throw new ProjectShareError(400, 'A code looks like SG-XXXX-XXXX-XXXX');
  }

  const found = await query<{
    code: string;
    title: string;
    learner_name: string;
    goal_name: string;
    mentor_name: string;
    mentor_title: string;
    body: string;
    signature: string;
    issued_at: Date | string;
  }>(
    `SELECT r.code, s.title, l.name AS learner_name, g.name AS goal_name,
            r.mentor_name, r.mentor_title, r.body, r.signature, r.issued_at
     FROM recommendations r
     JOIN project_shares s ON s.id = r.share_id
     JOIN users l ON l.id = s.learner_id
     JOIN goals g ON g.id = s.goal_id
     WHERE r.code = $1`,
    [code]
  );
  if (found.rowCount === 0) throw new ProjectShareError(404, 'No recommendation has this code');

  const row = found.rows[0];
  return {
    code: row.code,
    projectTitle: row.title,
    learnerName: row.learner_name,
    goalName: row.goal_name,
    mentorName: row.mentor_name,
    mentorTitle: row.mentor_title,
    body: row.body,
    signature: row.signature,
    issuedAt: new Date(row.issued_at).toISOString(),
  };
};