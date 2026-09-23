-- SkillGraph database schema
-- مخطط قاعدة بيانات SkillGraph
-- Run once to create tables and constraints / يُنفَّذ مرة واحدة لإنشاء الجداول والقيود

-- Generate UUIDs for users / توليد معرفات UUID للمستخدمين
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Account roles / أدوار الحسابات
CREATE TYPE user_role AS ENUM ('USER', 'ADMIN');

-- User path status toward a career goal / حالة مسار المستخدم نحو هدف مهني
CREATE TYPE user_goal_status AS ENUM ('ACTIVE', 'PAUSED', 'COMPLETED');

-- Accounts: unique email, hashed password / الحسابات: البريد فريد وكلمة المرور مشفّرة
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'USER',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- The system's seven career goals / الأهداف المهنية السبعة للنظام
CREATE TABLE goals (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Shared skills used across goals / المهارات العامة المشتركة بين الأهداف
CREATE TABLE skills (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL UNIQUE,
  description TEXT,
  category VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Goal-skill link: mastery threshold, importance, estimated hours
-- ربط المهارة بالهدف: شرط التمكن، الأهمية، والساعات المقدّرة
CREATE TABLE goal_skills (
  goal_id INTEGER NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  skill_id INTEGER NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  required_proficiency NUMERIC(3, 2) NOT NULL DEFAULT 0.70
    CHECK (required_proficiency BETWEEN 0 AND 1),
  importance NUMERIC(3, 2) NOT NULL DEFAULT 0.50
    CHECK (importance BETWEEN 0 AND 1),
  estimated_hours INTEGER NOT NULL DEFAULT 0
    CHECK (estimated_hours >= 0),
  PRIMARY KEY (goal_id, skill_id)
);

-- Directed graph: skill requires a prerequisite
-- مخطط بياني موجّه: المهارة تتطلب متطلباً سابقاً
CREATE TABLE skill_dependencies (
  skill_id INTEGER NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  prerequisite_skill_id INTEGER NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  PRIMARY KEY (skill_id, prerequisite_skill_id),
  CHECK (skill_id <> prerequisite_skill_id)
);

-- User's current path toward a specific goal / المسار الحالي للمستخدم نحو هدف معيّن
CREATE TABLE user_goals (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  goal_id INTEGER NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  status user_goal_status NOT NULL DEFAULT 'ACTIVE',
  is_current BOOLEAN NOT NULL DEFAULT TRUE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, goal_id)
);

-- User proficiency and confidence per skill (algorithm input)
-- مستوى التمكين الفعلي والثقة لكل مستخدم في كل مهارة (مدخل الخوارزمية)
CREATE TABLE user_skills (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill_id INTEGER NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  proficiency_level NUMERIC(3, 2) NOT NULL DEFAULT 0
    CHECK (proficiency_level BETWEEN 0 AND 1),
  confidence NUMERIC(3, 2) NOT NULL DEFAULT 0
    CHECK (confidence BETWEEN 0 AND 1),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, skill_id)
);

-- Only one current goal per user / هدف حالي واحد فقط لكل مستخدم
CREATE UNIQUE INDEX one_current_goal_per_user
  ON user_goals (user_id)
  WHERE is_current = TRUE;

-- Indexes to speed up graph and recommendation queries
-- فهارس لتسريع استعلامات الرسم البياني والترشيح
CREATE INDEX idx_goal_skills_skill ON goal_skills (skill_id);
CREATE INDEX idx_skill_deps_prereq ON skill_dependencies (prerequisite_skill_id);
CREATE INDEX idx_user_skills_skill ON user_skills (skill_id);
CREATE INDEX idx_user_goals_goal ON user_goals (goal_id);
