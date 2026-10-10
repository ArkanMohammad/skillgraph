/**
 * إنشاء/تحديث جداول التقييم إن لم تكن موجودة (قواعد قائمة مسبقاً)
 * Create or upgrade the assessment tables (for databases that already exist)
 * Safe to run on every start: every statement is idempotent.
 */
import { query } from './db';

export const ensureAssessmentSchema = async (): Promise<void> => {
  // Create the enum only if it does not exist yet.
  // Plain SQL on purpose: a DO $$ ... $$ block needs plpgsql.dll, which Windows
  // "Application Control" can block (error 58P01).
  const enumExists = await query(`SELECT 1 FROM pg_type WHERE typname = 'skill_state'`);
  if (enumExists.rowCount === 0) {
    await query(
      `CREATE TYPE skill_state AS ENUM ('LOCKED', 'READY', 'LEARNING', 'PRACTICING', 'MASTERED')`
    );
  }

  // New states from the design doc / حالات جديدة حسب وثيقة التصميم
  await query(`ALTER TYPE skill_state ADD VALUE IF NOT EXISTS 'ASSESSING'`);
  await query(`ALTER TYPE skill_state ADD VALUE IF NOT EXISTS 'NEEDS_VERIFICATION'`);

  await query(`
    ALTER TABLE user_skills
    ADD COLUMN IF NOT EXISTS state skill_state NOT NULL DEFAULT 'READY'
  `);

  await query(`
    ALTER TABLE user_skills
    ADD COLUMN IF NOT EXISTS last_assessed_at TIMESTAMPTZ
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

  // Sub-skills used for the per-concept score / مفاهيم فرعية لحساب نتيجة كل مفهوم
  await query(`
    CREATE TABLE IF NOT EXISTS concepts (
      id SERIAL PRIMARY KEY,
      skill_id INTEGER NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
      name VARCHAR(150) NOT NULL,
      weight NUMERIC(3, 2) NOT NULL DEFAULT 1.00 CHECK (weight > 0 AND weight <= 1),
      UNIQUE (skill_id, name)
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS questions (
      id SERIAL PRIMARY KEY,
      skill_id INTEGER NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
      prompt TEXT NOT NULL
    )
  `);

  // Upgrade an older questions table: concept + difficulty (1 easy, 2 medium, 3 hard)
  await query(`
    ALTER TABLE questions
    ADD COLUMN IF NOT EXISTS concept_id INTEGER REFERENCES concepts(id) ON DELETE SET NULL
  `);
  await query(`
    ALTER TABLE questions
    ADD COLUMN IF NOT EXISTS difficulty SMALLINT NOT NULL DEFAULT 2
      CHECK (difficulty BETWEEN 1 AND 3)
  `);

  // Needed so the seed can run many times without duplicating questions
  // ملاحظة: إن وُجدت أسئلة مكرّرة قديمة سينتبه السكربت ويخبرك
  await query(`
    CREATE UNIQUE INDEX IF NOT EXISTS uq_questions_skill_prompt
    ON questions (skill_id, prompt)
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

  await query(`CREATE INDEX IF NOT EXISTS idx_concepts_skill ON concepts (skill_id)`);
  await query(
    `CREATE INDEX IF NOT EXISTS idx_questions_skill_difficulty ON questions (skill_id, difficulty)`
  );
};