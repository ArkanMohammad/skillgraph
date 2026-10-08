/**
 * أنواع TypeScript المطابقة لجداول PostgreSQL
 * TypeScript types matching the PostgreSQL tables
 */
export type UserRole = 'USER' | 'ADMIN';
export type UserGoalStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED';
export type SkillState = 'LOCKED' | 'READY' | 'LEARNING' | 'PRACTICING' | 'MASTERED';

/** JWT payload after login / بيانات التوكن بعد تسجيل الدخول */
export interface AuthPayload {
  id: string;
  email: string;
  role: UserRole;
}

/** User account with hashed password and role / حساب مستخدم مع كلمة مرور مشفّرة ودور */
export interface User {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: UserRole;
  created_at: Date;
  updated_at: Date;
}

/** One of the seven career goals / هدف مهني من الأهداف السبعة */
export interface Goal {
  id: number;
  name: string;
  description: string | null;
  created_at: Date;
}

/** Shared skill used across goals / مهارة عامة مشتركة */
export interface Skill {
  id: number;
  name: string;
  description: string | null;
  category: string | null;
  created_at: Date;
}

/** Links a skill to a goal: mastery, importance, hours / ربط مهارة بهدف */
export interface GoalSkill {
  goal_id: number;
  skill_id: number;
  required_proficiency: number;
  importance: number;
  estimated_hours: number;
}

/** Directed graph edge: skill requires a prerequisite / متطلب سابق */
export interface SkillDependency {
  skill_id: number;
  prerequisite_skill_id: number;
}

/** User's current path toward a goal / مسار المستخدم الحالي نحو هدف */
export interface UserGoal {
  user_id: string;
  goal_id: number;
  status: UserGoalStatus;
  is_current: boolean;
  started_at: Date;
  completed_at: Date | null;
}

/** Actual proficiency and confidence for the algorithm / مستوى التمكين والثقة */
export interface UserSkill {
  user_id: string;
  skill_id: number;
  proficiency_level: number;
  confidence: number;
  state: SkillState;
  updated_at: Date;
}

/** Assessment session / جلسة تقييم لمهارة */
export interface Assessment {
  id: number;
  user_id: string;
  skill_id: number;
  started_at: Date;
  completed_at: Date | null;
  final_score: number | null;
}

/** Question belonging to a skill / سؤال تابع لمهارة */
export interface Question {
  id: number;
  skill_id: number;
  prompt: string;
}

/** Answer choice; is_correct stays server-side / خيار إجابة — الصحيح يبقى في السيرفر */
export interface QuestionOption {
  id: number;
  question_id: number;
  option_text: string;
  is_correct: boolean;
}

/** Saved answer for one question / إجابة محفوظة لسؤال */
export interface AssessmentAnswer {
  assessment_id: number;
  question_id: number;
  selected_option_id: number;
  is_correct: boolean;
  answered_at: Date;
}

/** Audit log for mastery changes / سجل أحداث التمكن */
export interface SkillEvent {
  id: number;
  user_id: string;
  skill_id: number;
  assessment_id: number | null;
  event_type: string;
  payload: Record<string, unknown> | null;
  created_at: Date;
}
