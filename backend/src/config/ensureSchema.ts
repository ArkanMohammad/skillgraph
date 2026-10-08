/**
 * إنشاء جداول التقييم إن لم تكن موجودة (قواعد قائمة مسبقاً)
 * Create assessment tables if missing (existing databases)
 */
import { query } from './db';

export const ensureAssessmentSchema = async (): Promise<void> => {
  await query(`
    DO $$ BEGIN
      CREATE TYPE skill_state AS ENUM ('LOCKED', 'READY', 'LEARNING', 'PRACTICING', 'MASTERED');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `);

  await query(`
    ALTER TABLE user_skills
    ADD COLUMN IF NOT EXISTS state skill_state NOT NULL DEFAULT 'READY'
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS assessments (
      id SERIAL PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      skill_id INTEGER NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
      started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      completed_at TIMESTAMPTZ,
      final_score NUMERIC(5, 2) CHECK (final_score IS NULL OR final_score BETWEEN 0 AND 100)
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS questions (
      id SERIAL PRIMARY KEY,
      skill_id INTEGER NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
      prompt TEXT NOT NULL
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS question_options (
      id SERIAL PRIMARY KEY,
      question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
      option_text TEXT NOT NULL,
      is_correct BOOLEAN NOT NULL DEFAULT FALSE
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS assessment_answers (
      assessment_id INTEGER NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
      question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
      selected_option_id INTEGER NOT NULL REFERENCES question_options(id),
      is_correct BOOLEAN NOT NULL,
      answered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (assessment_id, question_id)
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS skill_events (
      id SERIAL PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      skill_id INTEGER NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
      assessment_id INTEGER REFERENCES assessments(id) ON DELETE SET NULL,
      event_type VARCHAR(50) NOT NULL,
      payload JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
};
