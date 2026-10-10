/**
 * Joins every question file into one list.
 * تجمع كل ملفات الأسئلة في قائمة واحدة.
 */
import { SkillQuestions } from './types';
import { webQuestions } from './questionsWeb';
import { dataQuestions } from './questionsData';
import { securityQuestions } from './questionsSecurity';
import { designQuestions } from './questionsDesign';
import { devopsQuestions } from './questionsDevops';

export const allQuestions: SkillQuestions[] = [
  ...webQuestions,
  ...dataQuestions,
  ...securityQuestions,
  ...designQuestions,
  ...devopsQuestions,
];