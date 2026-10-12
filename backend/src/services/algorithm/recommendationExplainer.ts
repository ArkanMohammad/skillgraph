/**
 * Recommendation explainer (pure functions: no database).
 * Turns the factor scores of a ranked candidate into a short, readable explanation.
 */
import {
  FactorName,
  GoalGraphData,
  RankedCandidate,
  getSkillStates,
} from './recommendationEngine';

/** A factor must reach this score (0-100) before it is mentioned as a reason */
const STRONG_FACTOR = 60;
const MAX_REASONS = 3;

export interface Explanation {
  summary: string; // One sentence for the user
  reasons: string[]; // The strongest reasons, best first
  unlocksCount: number; // How many not-mastered skills come after this one
  margin: number | null; // Utility points ahead of the runner-up (null when alone)
}

export type ExplainedCandidate = RankedCandidate & { explanation: Explanation };

/** Counts the skills that come after this one (directly or not) and are not mastered yet */
export const countUnlockedSkills = (skillId: number, data: GoalGraphData): number => {
  const states = getSkillStates(data);
  const dependents = new Map<number, number[]>();
  for (const edge of data.edges) {
    dependents.set(edge.prerequisiteId, [...(dependents.get(edge.prerequisiteId) ?? []), edge.skillId]);
  }

  const visited = new Set<number>([skillId]);
  const queue: number[] = [skillId];
  let count = 0;
  while (queue.length > 0) {
    const current = queue.shift() as number;
    for (const nextId of dependents.get(current) ?? []) {
      if (visited.has(nextId)) continue;
      visited.add(nextId);
      queue.push(nextId);
      if (states.get(nextId) !== 'MASTERED') count += 1;
    }
  }
  return count;
};

/** One readable sentence for a factor, or null when the factor is not worth mentioning */
const describeFactor = (
  name: FactorName,
  candidate: RankedCandidate,
  unlocksCount: number
): string | null => {
  if (candidate.factors[name] < STRONG_FACTOR) return null;

  switch (name) {
    case 'goalImpact':
      return 'it matters a lot for your goal';
    case 'readiness':
      return 'you are prepared for it';
    case 'unlockPotential':
      return unlocksCount > 0
        ? `it opens the way to ${unlocksCount} more skill${unlocksCount === 1 ? '' : 's'}`
        : null;
    case 'gapPriority':
      return `there is a big gap to close (${candidate.currentMastery}% now, ${candidate.requiredMastery}% required)`;
    case 'timeEfficiency':
      return `it is quick to learn (about ${candidate.estimatedHours} hours)`;
    default:
      return null;
  }
};

/** Joins reasons into "a", "a and b" or "a, b and c" */
const joinReasons = (reasons: string[]): string => {
  if (reasons.length <= 1) return reasons[0] ?? '';
  return `${reasons.slice(0, -1).join(', ')} and ${reasons[reasons.length - 1]}`;
};

/** Explains one candidate. runnerUp is the next candidate in the ranking (if any). */
export const explainCandidate = (
  candidate: RankedCandidate,
  data: GoalGraphData,
  runnerUp: RankedCandidate | null
): Explanation => {
  const unlocksCount = countUnlockedSkills(candidate.skillId, data);

  // Strongest contributions first, so the main reasons come first
  const byContribution = (Object.keys(candidate.contributions) as FactorName[]).sort(
    (a, b) => candidate.contributions[b] - candidate.contributions[a]
  );

  const reasons: string[] = [];
  for (const name of byContribution) {
    const text = describeFactor(name, candidate, unlocksCount);
    if (text) reasons.push(text);
    if (reasons.length === MAX_REASONS) break;
  }

  const margin = runnerUp ? Math.round((candidate.utilityScore - runnerUp.utilityScore) * 10) / 10 : null;

  const because =
    reasons.length > 0
      ? `because ${joinReasons(reasons)}`
      : 'because it is the best available step right now';
  const comparison = runnerUp ? ` It scores ${margin} points higher than ${runnerUp.skillName}.` : '';

  return {
    summary: `${candidate.skillName} is recommended ${because}.${comparison}`,
    reasons,
    unlocksCount,
    margin,
  };
};

/** Adds an explanation to every ranked candidate */
export const explainCandidates = (
  candidates: RankedCandidate[],
  data: GoalGraphData
): ExplainedCandidate[] =>
  candidates.map((candidate, index) => ({
    ...candidate,
    explanation: explainCandidate(candidate, data, candidates[index + 1] ?? null),
  }));