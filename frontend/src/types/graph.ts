export type SkillState = 'MASTERED' | 'LEARNING' | 'READY' | 'LOCKED';

export type GraphNode = {
  id: string;
  name: string;
  category: string;
  requiredMastery: number; // percent 0-100
  userState: SkillState;
  mastery: number;         // percent 0-100
  confidence: number;      // percent 0-100
};

export type GraphEdge = {
  source: string; // prerequisite
  target: string; // dependent
  requiredMastery: number;
};

export type GoalGraph = { nodes: GraphNode[]; edges: GraphEdge[] };