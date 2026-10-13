-- Day 15: admin content management.
-- A question can be hidden (is_active = FALSE) instead of deleted, so the answers of users
-- and their progress stay safe. The assessment only picks active questions.
-- Safe to run once; the column and the index are created only if they do not exist.

ALTER TABLE questions ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

-- The assessment reads the active questions of one skill
CREATE INDEX IF NOT EXISTS idx_questions_skill_active ON questions (skill_id) WHERE is_active;