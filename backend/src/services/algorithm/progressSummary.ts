/**
 * Progress summary of one goal (pure functions: no database, easy to unit test).
 *
 *  - percent: importance-weighted average of min(mastery / required, 1), 0-100.
 *    A skill that is half way to its requirement counts as half, so the number moves
 *    after every assessment (not only when a skill becomes MASTERED).
 *  - hoursRemaining: for every skill that is not mastered, estimatedHours x (gap / required).
 *  - categories: the same numbers grouped by skill category.
 */
import { GoalGraphData, GoalSkillNode, UserProgress, computeGap, isMastered } from './recommendationEngine';

export interface CategoryProgress {
  category: string;
  totalSkills: number;
  masteredSkills: number;
  percent: number; // 0-100
}

export interface ProgressSummary {
  totalSkills: number;
  masteredSkills: number;
  percent: number; // 0-100, importance weighted
  hoursRemaining: number; // Whole hours, rounded up
  categories: CategoryProgress[];
}

const NO_PROGRESS: UserProgress = { mastery: 0, confidence: 0 };

/** How close one skill is to its requirement, from 0 to 1 */
export const skillCompletion = (skill: GoalSkillNode, progress: UserProgress): number =>
  skill.requiredMastery <= 0 ? 1 : Math.min(progress.mastery / skill.requiredMastery, 1);

/** Importance weighted completion of a list of skills, 0-100 (an empty list gives 0) */
const weightedPercent = (skills: GoalSkillNode[], data: GoalGraphData): number => {
  let sum = 0;
  let weightTotal = 0;
  for (const skill of skills) {
    const weight = skill.importance > 0 ? skill.importance : 1;
    sum += weight * skillCompletion(skill, data.progress.get(skill.skillId) ?? NO_PROGRESS);
    weightTotal += weight;
  }
  return weightTotal === 0 ? 0 : Math.round((sum / weightTotal) * 100);
};

/** Builds the whole summary for the Progress page */
export const summarizeProgress = (data: GoalGraphData): ProgressSummary => {
  const progressOf = (skill: GoalSkillNode): UserProgress => data.progress.get(skill.skillId) ?? NO_PROGRESS;

  let hours = 0;
  for (const skill of data.skills) {
    const progress = progressOf(skill);
    if (isMastered(skill, progress) || skill.requiredMastery <= 0) continue;
    hours += skill.estimatedHours * (computeGap(skill, progress) / skill.requiredMastery);
  }

  const byCategory = new Map<string, GoalSkillNode[]>();
  for (const skill of data.skills) {
    const key = skill.category ?? 'General';
    byCategory.set(key, [...(byCategory.get(key) ?? []), skill]);
  }

  const categories: CategoryProgress[] = [...byCategory.entries()]
    .map(([category, skills]) => ({
      category,
      totalSkills: skills.length,
      masteredSkills: skills.filter((skill) => isMastered(skill, progressOf(skill))).length,
      percent: weightedPercent(skills, data),
    }))
    .sort((a, b) => a.category.localeCompare(b.category));

  return {
    totalSkills: data.skills.length,
    masteredSkills: data.skills.filter((skill) => isMastered(skill, progressOf(skill))).length,
    percent: weightedPercent(data.skills, data),
    hoursRemaining: Math.ceil(hours),
    categories,
  };
};