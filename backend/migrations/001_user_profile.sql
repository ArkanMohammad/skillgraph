-- Weekly learning hours of the user (shown and edited on the My Profile page)
ALTER TABLE users ADD COLUMN IF NOT EXISTS weekly_hours SMALLINT NOT NULL DEFAULT 10;
ALTER TABLE users ADD CONSTRAINT users_weekly_hours_check CHECK (weekly_hours BETWEEN 1 AND 80);