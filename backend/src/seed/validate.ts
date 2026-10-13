/**
 * Checks the seed data BEFORE touching the database (so a typo never breaks the DB).
 */
import { DEPENDENCIES, GOAL_SKILLS, SKILLS } from './catalog';
import { allQuestions, extraQuestions } from './allQuestions';

/** Every skill has 10 questions: 3 easy, 4 medium, 3 hard (an assessment asks 4 of them) */
export const QUESTIONS_PER_SKILL = 10;
export const QUESTIONS_PER_DIFFICULTY: Record<number, number> = { 1: 3, 2: 4, 3: 3 };

export function validateSeedData(): string[] {
  const problems: string[] = [];
  const skillNames = new Set(SKILLS.map((s) => s.name));
  const prompts = new Set<string>();

  if (skillNames.size !== SKILLS.length) problems.push('Duplicate skill names in SKILLS');

  for (const [skill, prerequisite] of DEPENDENCIES) {
    if (!skillNames.has(skill)) problems.push(`Dependency: unknown skill "${skill}"`);
    if (!skillNames.has(prerequisite)) problems.push(`Dependency: unknown prerequisite "${prerequisite}"`);
  }

  for (const [goal, list] of Object.entries(GOAL_SKILLS)) {
    for (const [skill, required, importance] of list) {
      if (!skillNames.has(skill)) problems.push(`Goal "${goal}": unknown skill "${skill}"`);
      if (required < 0 || required > 1 || importance < 0 || importance > 1) {
        problems.push(`Goal "${goal}": ${skill} has a value outside 0-1`);
      }
    }
  }

  // The prerequisite graph must not contain a cycle (A needs B and B needs A)
  const prereqsOf = new Map<string, string[]>();
  for (const [skill, prerequisite] of DEPENDENCIES) {
    prereqsOf.set(skill, [...(prereqsOf.get(skill) ?? []), prerequisite]);
  }
  const visiting = new Set<string>();
  const done = new Set<string>();
  const visit = (name: string): void => {
    if (done.has(name)) return;
    if (visiting.has(name)) {
      problems.push(`Dependency cycle through "${name}"`);
      return;
    }
    visiting.add(name);
    for (const next of prereqsOf.get(name) ?? []) visit(next);
    visiting.delete(name);
    done.add(name);
  };
  for (const name of skillNames) visit(name);

  const covered = new Set<string>();
  for (const item of allQuestions) {
    const label = `Skill "${item.skill}"`;
    if (!skillNames.has(item.skill)) problems.push(`${label}: not in SKILLS`);
    if (covered.has(item.skill)) problems.push(`${label}: defined twice`);
    covered.add(item.skill);

    const weightSum = item.concepts.reduce((sum, [, weight]) => sum + weight, 0);
    if (Math.abs(weightSum - 1) > 0.001) problems.push(`${label}: concept weights add up to ${weightSum}`);

    if (item.questions.length !== QUESTIONS_PER_SKILL) {
      problems.push(`${label}: has ${item.questions.length} questions (expected ${QUESTIONS_PER_SKILL})`);
    }
    for (const level of [1, 2, 3]) {
      const count = item.questions.filter((q) => q[1] === level).length;
      if (count !== QUESTIONS_PER_DIFFICULTY[level]) {
        problems.push(`${label}: ${count} questions at difficulty ${level} (expected ${QUESTIONS_PER_DIFFICULTY[level]})`);
      }
    }

    const usedConcepts = new Set<number>();
    for (const [conceptIndex, , prompt, correct, wrong] of item.questions) {
      usedConcepts.add(conceptIndex);
      if (conceptIndex < 0 || conceptIndex >= item.concepts.length) {
        problems.push(`${label}: bad concept index in "${prompt}"`);
      }
      const options = [correct, ...wrong];
      if (new Set(options).size !== 4 || options.some((o) => !o.trim())) {
        problems.push(`${label}: options must be 4 different non-empty texts in "${prompt}"`);
      }
      const key = `${item.skill}::${prompt}`;
      if (prompts.has(key)) problems.push(`${label}: duplicate question "${prompt}"`);
      prompts.add(key);
    }
    if (usedConcepts.size !== item.concepts.length) problems.push(`${label}: a concept has no question`);
  }

  for (const name of skillNames) {
    if (!covered.has(name)) problems.push(`Skill "${name}" has no questions`);
  }

  // Extra questions must belong to a skill that has base questions, and only once
  const extraSeen = new Set<string>();
  for (const extra of extraQuestions) {
    if (!covered.has(extra.skill)) problems.push(`Extra questions: skill "${extra.skill}" has no base questions`);
    if (extraSeen.has(extra.skill)) problems.push(`Extra questions: skill "${extra.skill}" is defined twice`);
    extraSeen.add(extra.skill);
  }

  return problems;
}