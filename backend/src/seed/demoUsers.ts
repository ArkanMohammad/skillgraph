/**
 * Demo accounts for the presentation: each one starts in a different situation, so every
 * feature can be shown in a minute. Safe to run again: it resets the demo accounts to the
 * state below every time (other users are never touched).
 *
 * Run from the backend folder:  npm run seed:demo
 * Password of every demo account: Demo1234!
 */
import bcrypt from 'bcrypt';
import { pool } from '../config/db';
import { MASTERED_CONFIDENCE, decideState } from '../services/algorithm/scoringService';

const DEMO_PASSWORD = 'Demo1234!';
const DEFAULT_REQUIRED = 0.75;

interface DemoUser {
  email: string;
  name: string;
  role: 'USER' | 'MENTOR' | 'ADMIN';
  goal: string | null;
  /** Goals this account looks after as a mentor (only for the role MENTOR) */
  mentorOf?: string[];
  /** [skill name, mastery 0-1, confidence 0-1] */
  progress: [string, number, number][];
  story: string;
}

const DEMO_USERS: DemoUser[] = [
  {
    email: 'demo.beginner@skillgraph.dev',
    name: 'Demo Beginner',
    role: 'USER',
    goal: 'Full Stack Developer',
    progress: [],
    story: 'Nothing mastered yet: the first recommendation is a foundation skill.',
  },
  {
    email: 'demo.midway@skillgraph.dev',
    name: 'Demo Midway',
    role: 'USER',
    goal: 'Frontend Developer',
    progress: [
      ['HTML', 0.9, 0.9],
      ['CSS', 0.85, 0.85],
      ['Responsive Design', 0.45, 0.5],
    ],
    story: 'HTML and CSS are mastered, Responsive Design is half done (shows in "Needs attention"), JavaScript is next.',
  },
  {
    email: 'demo.switcher@skillgraph.dev',
    name: 'Demo Switcher',
    role: 'USER',
    goal: 'Frontend Developer',
    progress: [
      ['HTML', 0.9, 0.9],
      ['CSS', 0.9, 0.85],
      ['JavaScript', 0.9, 0.85],
      ['Git', 0.85, 0.8],
    ],
    story: 'Change the goal to Backend Developer or Full Stack: the progress of the shared skills is reused, nothing starts from zero.',
  },
  {
    email: 'demo.finisher@skillgraph.dev',
    name: 'Demo Finisher',
    role: 'USER',
    goal: 'Frontend Developer',
    progress: [
      ['HTML', 0.95, 0.9],
      ['CSS', 0.95, 0.9],
      ['Responsive Design', 0.9, 0.9],
      ['JavaScript', 0.95, 0.9],
      ['Git', 0.9, 0.9],
      ['TypeScript', 0.9, 0.9],
      ['React', 0.95, 0.9],
      ['State Management (Redux)', 0.9, 0.9],
      ['Web Accessibility', 0.9, 0.9],
    ],
    story: 'Every Frontend skill is mastered: the dashboard shows the goal as complete. Change the goal to see a new plan.',
  },
  {
    email: 'demo.admin@skillgraph.dev',
    name: 'Demo Admin',
    role: 'ADMIN',
    goal: 'Full Stack Developer',
    progress: [],
    story: 'Role ADMIN: shows the Admin page (overview and role control).',
  },
  {
    email: 'demo.mentor@skillgraph.dev',
    name: 'Demo Mentor',
    role: 'MENTOR',
    goal: 'Frontend Developer',
    mentorOf: ['Frontend Developer', 'Full Stack Developer'],
    progress: [],
    story: 'Role MENTOR: looks after the Frontend and Full Stack goals, so the other demo users see "Your mentor" on the dashboard.',
  },
];

async function main(): Promise<void> {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    for (const demo of DEMO_USERS) {
      // 1) The account (created or reset)
      const user = await client.query<{ id: string }>(
        `INSERT INTO users (name, email, password_hash, role)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (email) DO UPDATE
         SET name = EXCLUDED.name, password_hash = EXCLUDED.password_hash, role = EXCLUDED.role
         RETURNING id`,
        [demo.name, demo.email, passwordHash, demo.role]
      );
      const userId = user.rows[0].id;

      // 2) Start from a clean state
      await client.query('DELETE FROM user_skills WHERE user_id = $1', [userId]);
      await client.query('DELETE FROM user_goals WHERE user_id = $1', [userId]);

      // 3) The current goal
      let goalId: number | null = null;
      if (demo.goal) {
        const goal = await client.query<{ id: number }>('SELECT id FROM goals WHERE name = $1', [demo.goal]);
        if (goal.rowCount === 0) throw new Error(`Goal "${demo.goal}" not found. Run the main seed first.`);
        goalId = goal.rows[0].id;
        await client.query(
          `INSERT INTO user_goals (user_id, goal_id, status, is_current) VALUES ($1, $2, 'ACTIVE', TRUE)`,
          [userId, goalId]
        );
      }

      // 4) The progress per skill (the state is decided by the same rule the assessments use)
      for (const [skillName, mastery, confidence] of demo.progress) {
        const skill = await client.query<{ id: number; required: string | number | null }>(
          `SELECT s.id,
                  (SELECT gs.required_proficiency FROM goal_skills gs WHERE gs.goal_id = $2 AND gs.skill_id = s.id) AS required
           FROM skills s WHERE s.name = $1`,
          [skillName, goalId]
        );
        if (skill.rowCount === 0) throw new Error(`Skill "${skillName}" not found. Run the main seed first.`);
        const required = skill.rows[0].required === null ? DEFAULT_REQUIRED : Number(skill.rows[0].required);
        const state = decideState(mastery, required, confidence);
        await client.query(
          `INSERT INTO user_skills (user_id, skill_id, proficiency_level, confidence, state, last_assessed_at)
           VALUES ($1, $2, $3, $4, $5, NOW())`,
          [userId, skill.rows[0].id, mastery, confidence, state]
        );
      }

      // 5) The goals this mentor looks after (reset every time, like the rest of the account)
      await client.query('DELETE FROM goal_mentors WHERE mentor_id = $1', [userId]);
      for (const goalName of demo.mentorOf ?? []) {
        const mentorGoal = await client.query<{ id: number }>('SELECT id FROM goals WHERE name = $1', [goalName]);
        if (mentorGoal.rowCount === 0) throw new Error(`Goal "${goalName}" not found. Run the main seed first.`);
        await client.query('INSERT INTO goal_mentors (goal_id, mentor_id) VALUES ($1, $2)', [mentorGoal.rows[0].id, userId]);
      }
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  console.log(`Demo accounts ready (password: ${DEMO_PASSWORD}, mastered means confidence >= ${MASTERED_CONFIDENCE})\n`);
  for (const demo of DEMO_USERS) {
    console.log(`${demo.email}\n    ${demo.story}`);
  }
  await pool.end();
}

main().catch(async (err) => {
  console.error(err);
  await pool.end().catch(() => undefined);
  process.exit(1);
});