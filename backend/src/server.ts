/**
 * Server entry point: global middlewares, API routes and start-up
 */
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { seedGoals } from './config/seedData';
import apiRoutes from './routes';
import authRoutes from './routes/authRoutes';
import accountRoutes from './routes/accountRoutes';
import goalRoutes from './routes/goalRoutes';
import graphRoutes from './routes/graphRoutes';
import assessmentRoutes from './routes/assessmentRoutes';
import recommendationRoutes from './routes/recommendationRoutes';
import progressRoutes from './routes/progressRoutes';
import adminRoutes from './routes/adminRoutes';
import adviceRoutes from './routes/adviceRoutes';
import reviewRoutes from './routes/reviewRoutes';
import mentorRoutes from './routes/mentorRoutes';
import { errorHandler, notFound } from './middleware';
import { ensureAssessmentSchema } from './config/ensureSchema';
import { runMigrations } from './config/migrate';

const app = express();

// Any http://localhost:<port> is allowed while developing
const LOCALHOST_ORIGIN = /^http:\/\/localhost:\d+$/;

app.use(
  cors({
    // Cookies need an exact origin (not "*"), so we check it ourselves
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // Postman, curl
      const allowed =
        origin === env.clientUrl || (!env.isProduction && LOCALHOST_ORIGIN.test(origin));
      callback(null, allowed);
    },
    credentials: true,
  })
);
app.use(express.json()); // Parse JSON request body
app.use(cookieParser()); // Read cookies (the login token)

app.use('/api', apiRoutes); // Health check: GET /api/health
app.use('/api/auth', authRoutes); // Auth: /register /login /me /logout
app.use('/api/account', accountRoutes); // Change password, delete account
app.use('/api/goals', goalRoutes); // Protected career goals
app.use('/api/graph', graphRoutes); // Skill graph for React Flow
app.use('/api/assessments', assessmentRoutes); // Assessment and mastery
app.use('/api/recommendations', recommendationRoutes); // Next Best Skill
app.use('/api/progress', progressRoutes); // Progress of the current goal and of every goal
app.use('/api/advice', adviceRoutes); // Advice written for the logged-in user
app.use('/api/review', reviewRoutes); // Knowledge decay: which mastered skills need a review
app.use('/api/mentors', mentorRoutes); // The mentors of the goal the user follows
app.use('/api/admin', adminRoutes); // Admin only (RBAC)

app.use(notFound);
app.use(errorHandler);

/** Seed then listen */
const start = async (): Promise<void> => {
  try {
    const applied = await runMigrations(); // Pending SQL migrations (schema_migrations table)
    if (applied.length > 0) console.log(`Migrations applied: ${applied.join(', ')}`);
    await ensureAssessmentSchema(); // Assessment tables if missing
    await seedGoals();
    app.listen(env.port, () => {
      console.log(`SkillGraph is running on port ${env.port}`);
    });
  } catch (err) {
    console.error('Failed to start the server:', err);
    process.exit(1);
  }
};

void start();