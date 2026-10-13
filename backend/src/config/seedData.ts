/**
 * Seed the seven career goals on startup
 */
import { query } from './db';

const CAREER_GOALS = [
  { name: 'Full Stack Developer', description: 'Build complete web apps' },
  { name: 'Frontend Developer', description: 'Build user interfaces' },
  { name: 'Backend Developer', description: 'Build server-side systems' },
  { name: 'Data Analyst', description: 'Analyze and visualize data' },
  { name: 'Cybersecurity Specialist', description: 'Protect systems and data' },
  { name: 'UI/UX Designer', description: 'Design usable interfaces' },
  { name: 'DevOps Engineer', description: 'Automate build and deploy' },
] as const;

/** Insert goals if missing */
export const seedGoals = async (): Promise<void> => {
  await query(
    `INSERT INTO goals (name, description)
     VALUES
       ($1, $2),
       ($3, $4),
       ($5, $6),
       ($7, $8),
       ($9, $10),
       ($11, $12),
       ($13, $14)
     ON CONFLICT (name) DO NOTHING`, // Skip duplicates
    CAREER_GOALS.flatMap((goal) => [goal.name, goal.description])
  );

  console.log('Career goals seeded');
};