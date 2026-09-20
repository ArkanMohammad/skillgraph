/**
 * أنواع TypeScript المطابقة لجداول PostgreSQL
 */
export type UserRole = 'USER' | 'ADMIN';
export type UserGoalStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED';

/** حساب مستخدم مع كلمة مرور مشفّرة ودور */
export interface User {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: UserRole;
  created_at: Date;
  updated_at: Date;
}

/** هدف مهني من الأهداف السبعة */
export interface Goal {
  id: number;
  name: string;
  description: string | null;
  created_at: Date;
}

/** مهارة عامة مشتركة */
export interface Skill {
  id: number;
  name: string;
  description: string | null;
  category: string | null;
  created_at: Date;
}

/** ربط مهارة بهدف مع شروط التمكن والأهمية والساعات */
export interface GoalSkill {
  goal_id: number;
  skill_id: number;
  required_proficiency: number;
  importance: number;
  estimated_hours: number;
}

/** علاقة متطلب سابق في المخطط البياني الموجّه */
export interface SkillDependency {
  skill_id: number;
  prerequisite_skill_id: number;
}

/** مسار المستخدم الحالي نحو هدف */
export interface UserGoal {
  user_id: string;
  goal_id: number;
  status: UserGoalStatus;
  is_current: boolean;
  started_at: Date;
  completed_at: Date | null;
}

/** مستوى التمكين والثقة لاستخدام الخوارزمية */
export interface UserSkill {
  user_id: string;
  skill_id: number;
  proficiency_level: number;
  confidence: number;
  updated_at: Date;
}
