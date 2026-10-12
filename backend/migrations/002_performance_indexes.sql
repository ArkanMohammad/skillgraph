-- Day 13: indexes for the queries the app runs most (found with EXPLAIN ANALYZE on 20,000 users).
-- Safe to run once; every index is created only if it does not exist.

-- Admin users list: ORDER BY created_at DESC LIMIT n no longer sorts every user
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users (created_at DESC);

-- Recent assessments, completed counts and the admin per-user counter (only finished tests)
CREATE INDEX IF NOT EXISTS idx_assessments_user_completed
  ON assessments (user_id, completed_at DESC)
  WHERE completed_at IS NOT NULL;

-- Resume an open assessment of one user and skill (only unfinished tests)
CREATE INDEX IF NOT EXISTS idx_assessments_open
  ON assessments (user_id, skill_id)
  WHERE completed_at IS NULL;

-- The options of a question are read on every question; the foreign key had no index
CREATE INDEX IF NOT EXISTS idx_question_options_question ON question_options (question_id);

-- Deleting or replacing an option checks the answers that point to it
CREATE INDEX IF NOT EXISTS idx_assessment_answers_option ON assessment_answers (selected_option_id);