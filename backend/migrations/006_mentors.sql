-- Mentors: people from the field who help the learners of a goal.
-- A mentor is a user with the role MENTOR. An admin assigns mentors to goals.
-- A goal can have several mentors and a mentor can look after several goals.
-- If the goal or the mentor account is deleted, the link is deleted with it.

ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'MENTOR';

CREATE TABLE IF NOT EXISTS goal_mentors (
  goal_id INTEGER NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  mentor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (goal_id, mentor_id)
);

-- "Which goals does this mentor look after?"
CREATE INDEX IF NOT EXISTS idx_goal_mentors_mentor ON goal_mentors (mentor_id);