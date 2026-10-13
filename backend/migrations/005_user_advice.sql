-- Advice that an admin writes for a user. The user sees it on the dashboard.
-- It is deleted together with the user. If the admin account is deleted, the advice stays
-- (admin_id becomes NULL). Safe to run once; everything is created only if it does not exist.

CREATE TABLE IF NOT EXISTS user_advice (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
  message TEXT NOT NULL CHECK (char_length(message) BETWEEN 1 AND 1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

-- The dashboard and the admin screen read the newest advice of one user
CREATE INDEX IF NOT EXISTS idx_user_advice_user ON user_advice (user_id, created_at DESC);