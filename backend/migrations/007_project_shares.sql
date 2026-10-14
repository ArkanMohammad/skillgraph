-- Project shares: a learner shares a project with a mentor of their goal,
-- and the mentor answers with a signed personal recommendation (or declines).
-- A recommendation is NOT an official certificate: it is the opinion of one person.
-- If the learner or the goal is deleted, their shares go with them.
-- If the mentor account is deleted, the share stays (mentor_id becomes NULL) and an issued
-- recommendation keeps the mentor name it was signed with.

CREATE TABLE IF NOT EXISTS project_shares (
  id SERIAL PRIMARY KEY,
  learner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mentor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  goal_id INTEGER NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  title VARCHAR(120) NOT NULL CHECK (char_length(trim(title)) >= 3),
  description TEXT NOT NULL CHECK (char_length(trim(description)) >= 20),
  project_url VARCHAR(500),
  status VARCHAR(12) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'RECOMMENDED', 'DECLINED')),
  decline_note VARCHAR(300),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  decided_at TIMESTAMPTZ
);

-- "What did this learner share?" and "What is waiting for this mentor?"
CREATE INDEX IF NOT EXISTS idx_project_shares_learner ON project_shares (learner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_project_shares_mentor ON project_shares (mentor_id, status);

CREATE TABLE IF NOT EXISTS recommendations (
  id SERIAL PRIMARY KEY,
  share_id INTEGER NOT NULL UNIQUE REFERENCES project_shares(id) ON DELETE CASCADE,
  mentor_name VARCHAR(100) NOT NULL,
  mentor_title VARCHAR(80) NOT NULL,
  body TEXT NOT NULL CHECK (char_length(trim(body)) >= 50),
  signature TEXT NOT NULL CHECK (signature LIKE 'data:image/png;base64,%'),
  code VARCHAR(20) NOT NULL UNIQUE,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);