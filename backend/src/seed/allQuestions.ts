/**
 * Joins every question file into one list.
 * Each skill has 6 base questions (the files questionsWeb, questionsData, ...) plus 4 extra
 * questions (the files ...Extra), so the bank of every skill has 10 questions.
 * An assessment still asks only 4 of them, so users get different questions between attempts.
 */
import { ExtraQuestions, SkillQuestions } from './types';
import { webQuestions } from './questionsWeb';
import { dataQuestions } from './questionsData';
import { securityQuestions } from './questionsSecurity';
import { designQuestions } from './questionsDesign';
import { devopsQuestions } from './questionsDevops';
import { webExtraQuestions } from './questionsWebExtra';
import { dataExtraQuestions } from './questionsDataExtra';
import { securityExtraQuestions } from './questionsSecurityExtra';
import { designExtraQuestions } from './questionsDesignExtra';
import { devopsExtraQuestions } from './questionsDevopsExtra';

const baseQuestions: SkillQuestions[] = [
  ...webQuestions,
  ...dataQuestions,
  ...securityQuestions,
  ...designQuestions,
  ...devopsQuestions,
];

export const extraQuestions: ExtraQuestions[] = [
  ...webExtraQuestions,
  ...dataExtraQuestions,
  ...securityExtraQuestions,
  ...designExtraQuestions,
  ...devopsExtraQuestions,
];

/** Base questions + extra questions of the same skill (validate.ts reports extras with no skill) */
export const allQuestions: SkillQuestions[] = baseQuestions.map((item) => {
  const extra = extraQuestions.find((e) => e.skill === item.skill);
  return extra ? { ...item, questions: [...item.questions, ...extra.questions] } : item;
});