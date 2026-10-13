/**
 * Joins every question file into one list.
 * Each skill has 6 base questions (the files questionsWeb, questionsData, ...), 4 extra questions
 * (the files ...Extra) and 5 more questions (the files ...More), so the bank of every skill
 * has 15 questions: 5 easy, 5 medium and 5 hard.
 * An assessment asks 10 of them, so users get different questions between attempts.
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
import { webMoreQuestions } from './questionsWebMore';
import { dataMoreQuestions } from './questionsDataMore';
import { securityMoreQuestions } from './questionsSecurityMore';
import { designMoreQuestions } from './questionsDesignMore';
import { devopsMoreQuestions } from './questionsDevopsMore';

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

export const moreQuestions: ExtraQuestions[] = [
  ...webMoreQuestions,
  ...dataMoreQuestions,
  ...securityMoreQuestions,
  ...designMoreQuestions,
  ...devopsMoreQuestions,
];

/** Base + extra + more questions of the same skill (validate.ts reports extras with no skill) */
export const allQuestions: SkillQuestions[] = baseQuestions.map((item) => {
  const added = [...extraQuestions, ...moreQuestions]
    .filter((e) => e.skill === item.skill)
    .flatMap((e) => e.questions);
  return added.length > 0 ? { ...item, questions: [...item.questions, ...added] } : item;
});