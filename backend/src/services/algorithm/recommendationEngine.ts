/**
 * Recommendation engine (pure functions: no database, easy to unit test).
 *
 * Pipeline:
 *  1. Skill states: MASTERED / READY / LOCKED (from mastery, confidence and prerequisites)
 *  2. Candidates: skills of the goal that are READY (not mastered, prerequisites satisfied)
 *  3. Factors for every candidate, each from 0 to 100:
 *       goalImpact, readiness, unlockPotential (BFS), gapPriority, timeEfficiency
 *  4. Utility = 0.30 GoalImpact + 0.25 Readiness + 0.20 UnlockPotential
 *             + 0.15 GapPriority + 0.10 TimeEfficiency
 *  5. Rank by utility; the first candidate is the Next Best Skill.
 */
import { MASTERED_CONFIDENCE } from './scoringService';

/** Weights of the utility formula (they add up to 1) */
export const UTILITY_WEIGHTS = {
  goalImpact: 0.3,
  readiness: 0.25,
  unlockPotential: 0.2,
  gapPriority: 0.15,
  timeEfficiency: 0.1,
} as const;

export type FactorName = keyof typeof UTILITY_WEIGHTS;
export type SkillGraphState = 'MASTERED' | 'READY' | 'LOCKED';

/** A skill inside one goal (mastery values are 0-1) */
export interface GoalSkillNode {
  skillId: number;
  name: string;
  category: string | null;
  requiredMastery: number; // Mastery the goal asks for
  importance: number; // How important the skill is for the goal
  estimatedHours: number;
}

/** prerequisiteId must be learned before skillId (both skills belong to the goal) */
export interface GraphEdge {
  skillId: number;
  prerequisiteId: number;
}

/** What the user has proven so far (skills never assessed are simply missing) */
export interface UserProgress {
  mastery: number; // 0-1
  confidence: number; // 0-1
}

export interface GoalGraphData {
  skills: GoalSkillNode[];
  edges: GraphEdge[];
  progress: Map<number, UserProgress>;
}

export type FactorScores = Record<FactorName, number>;

export interface RankedCandidate {
  skillId: number;
  skillName: string;
  category: string | null;
  utilityScore: number; // 0-100, one decimal
  status: 'READY';
  currentMastery: number; // 0-100
  requiredMastery: number; // 0-100
  gap: number; // 0-100, how much mastery is still missing
  estimatedHours: number;
  factors: FactorScores; // 0-100 each
  contributions: FactorScores; // weight x factor: how many utility points each factor gave
}

export interface Recommendation {
  goalComplete: boolean; // True when every skill of the goal is mastered
  next: RankedCandidate | null;
  candidates: RankedCandidate[]; // Best first
}

const round1 = (value: number): number => Math.round(value * 10) / 10;
const clamp100 = (value: number): number => Math.min(100, Math.max(0, value));

const progressOf = (data: GoalGraphData, skillId: number): UserProgress =>
  data.progress.get(skillId) ?? { mastery: 0, confidence: 0 };

const skillById = (data: GoalGraphData): Map<number, GoalSkillNode> =>
  new Map(data.skills.map((skill) => [skill.skillId, skill]));

/** Prerequisites of every skill: skillId -> list of prerequisite ids */
const prerequisitesMap = (data: GoalGraphData): Map<number, number[]> => {
  const map = new Map<number, number[]>();
  for (const edge of data.edges) {
    map.set(edge.skillId, [...(map.get(edge.skillId) ?? []), edge.prerequisiteId]);
  }
  return map;
};

/** Skills that become reachable after each skill: prerequisiteId -> list of skill ids */
const dependentsMap = (data: GoalGraphData): Map<number, number[]> => {
  const map = new Map<number, number[]>();
  for (const edge of data.edges) {
    map.set(edge.prerequisiteId, [...(map.get(edge.prerequisiteId) ?? []), edge.skillId]);
  }
  return map;
};

/** MASTERED needs enough mastery AND enough confidence */
export const isMastered = (skill: GoalSkillNode, progress: UserProgress): boolean =>
  progress.mastery >= skill.requiredMastery && progress.confidence >= MASTERED_CONFIDENCE;

/** Gap = max(required - current, 0), values 0-1 */
export const computeGap = (skill: GoalSkillNode, progress: UserProgress): number =>
  Math.max(skill.requiredMastery - progress.mastery, 0);

/** A prerequisite is satisfied when its mastery reaches the level the goal requires */
const prerequisiteSatisfied = (prerequisite: GoalSkillNode, progress: UserProgress): boolean =>
  progress.mastery >= prerequisite.requiredMastery;

/** State of every skill of the goal (one place decides, the graph and the engine share it) */
export const getSkillStates = (data: GoalGraphData): Map<number, SkillGraphState> => {
  const skills = skillById(data);
  const prerequisites = prerequisitesMap(data);
  const states = new Map<number, SkillGraphState>();

  for (const skill of data.skills) {
    if (isMastered(skill, progressOf(data, skill.skillId))) {
      states.set(skill.skillId, 'MASTERED');
      continue;
    }
    const unlocked = (prerequisites.get(skill.skillId) ?? []).every((prerequisiteId) => {
      const prerequisite = skills.get(prerequisiteId);
      return !prerequisite || prerequisiteSatisfied(prerequisite, progressOf(data, prerequisiteId));
    });
    states.set(skill.skillId, unlocked ? 'READY' : 'LOCKED');
  }
  return states;
};

/** Skills of the goal that are not mastered and whose prerequisites are satisfied */
export const getCandidateSkills = (data: GoalGraphData): GoalSkillNode[] => {
  const states = getSkillStates(data);
  return data.skills.filter((skill) => states.get(skill.skillId) === 'READY');
};

/**
 * Readiness 0-100: weighted average of min(userMastery / requiredMastery, 1)
 * over the prerequisites (weight = importance of the prerequisite). No prerequisites = 100.
 */
export const computeReadiness = (skill: GoalSkillNode, data: GoalGraphData): number => {
  const skills = skillById(data);
  const prerequisiteIds = prerequisitesMap(data).get(skill.skillId) ?? [];
  if (prerequisiteIds.length === 0) return 100;

  let weightedSum = 0;
  let weightTotal = 0;
  for (const id of prerequisiteIds) {
    const prerequisite = skills.get(id);
    if (!prerequisite) continue;
    const ratio =
      prerequisite.requiredMastery <= 0
        ? 1
        : Math.min(progressOf(data, id).mastery / prerequisite.requiredMastery, 1);
    const weight = prerequisite.importance > 0 ? prerequisite.importance : 1;
    weightedSum += weight * ratio;
    weightTotal += weight;
  }
  return weightTotal === 0 ? 100 : (weightedSum / weightTotal) * 100;
};

/** Gap priority 0-100: the missing part of the required mastery */
export const computeGapPriority = (skill: GoalSkillNode, progress: UserProgress): number =>
  skill.requiredMastery <= 0 ? 0 : clamp100((computeGap(skill, progress) / skill.requiredMastery) * 100);

/**
 * Raw unlock value: breadth-first walk over the skills that come after this one
 * (directly or through other skills). Adds the importance of every one that is not mastered yet.
 */
export const computeUnlockValue = (skill: GoalSkillNode, data: GoalGraphData): number => {
  const skills = skillById(data);
  const dependents = dependentsMap(data);
  const visited = new Set<number>([skill.skillId]); // Also protects against cycles
  const queue: number[] = [skill.skillId];
  let total = 0;

  while (queue.length > 0) {
    const current = queue.shift() as number;
    for (const nextId of dependents.get(current) ?? []) {
      if (visited.has(nextId)) continue;
      visited.add(nextId);
      queue.push(nextId);

      const next = skills.get(nextId);
      if (next && !isMastered(next, progressOf(data, nextId))) total += next.importance;
    }
  }
  return total;
};

/** Scales raw values to 0-100 by the biggest value in the list (all zero stays zero) */
const scaleToMax = (values: number[]): number[] => {
  const max = Math.max(0, ...values);
  return values.map((value) => (max === 0 ? 0 : (value / max) * 100));
};

/**
 * Time efficiency 0-100: lower estimated hours is better.
 * Min-max inverted inside the candidate set; when all hours are equal nobody is punished (100).
 */
const timeEfficiencies = (hours: number[]): number[] => {
  const min = Math.min(...hours);
  const max = Math.max(...hours);
  return hours.map((value) => (max === min ? 100 : ((max - value) / (max - min)) * 100));
};

/** Ranks the candidates with the utility formula */
export const rankCandidates = (data: GoalGraphData): RankedCandidate[] => {
  const candidates = getCandidateSkills(data);
  if (candidates.length === 0) return [];

  const unlock = scaleToMax(candidates.map((skill) => computeUnlockValue(skill, data)));
  const efficiency = timeEfficiencies(candidates.map((skill) => skill.estimatedHours));

  const ranked = candidates.map((skill, index): RankedCandidate => {
    const progress = progressOf(data, skill.skillId);
    const factors: FactorScores = {
      goalImpact: clamp100(skill.importance * 100),
      readiness: computeReadiness(skill, data),
      unlockPotential: unlock[index],
      gapPriority: computeGapPriority(skill, progress),
      timeEfficiency: efficiency[index],
    };

    const contributions = {} as FactorScores;
    let utility = 0;
    for (const name of Object.keys(UTILITY_WEIGHTS) as FactorName[]) {
      contributions[name] = round1(UTILITY_WEIGHTS[name] * factors[name]);
      utility += UTILITY_WEIGHTS[name] * factors[name];
      factors[name] = Math.round(factors[name]);
    }

    return {
      skillId: skill.skillId,
      skillName: skill.name,
      category: skill.category,
      utilityScore: round1(utility),
      status: 'READY',
      currentMastery: Math.round(progress.mastery * 100),
      requiredMastery: Math.round(skill.requiredMastery * 100),
      gap: Math.round(computeGap(skill, progress) * 100),
      estimatedHours: skill.estimatedHours,
      factors,
      contributions,
    };
  });

  // Best first; ties go to the more important skill, then the lower id (stable result)
  return ranked.sort(
    (a, b) =>
      b.utilityScore - a.utilityScore ||
      b.factors.goalImpact - a.factors.goalImpact ||
      a.skillId - b.skillId
  );
};

/** Next Best Skill: ranked candidates, or goalComplete when everything is mastered */
export const getNextBestSkill = (data: GoalGraphData): Recommendation => {
  const states = getSkillStates(data);
  const goalComplete =
    data.skills.length > 0 && data.skills.every((skill) => states.get(skill.skillId) === 'MASTERED');

  const candidates = rankCandidates(data);
  return { goalComplete, next: candidates[0] ?? null, candidates };
};