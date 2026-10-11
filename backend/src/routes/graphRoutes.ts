/**
 * Graph API: skill nodes and prerequisite edges for React Flow.
 * The state of every node (MASTERED / READY / LOCKED) comes from the recommendation engine,
 * so the graph and the Next Best Skill always agree.
 */
import { Router, Request, Response } from 'express';
import { authenticateJWT } from '../middleware/authMiddleware';
import { getSkillStates } from '../services/algorithm/recommendationEngine';
import { loadGoalGraphData } from '../services/recommendationService';

const router = Router();

router.use(authenticateJWT); // Protect graph routes

interface GraphNode {
  id: number;
  name: string;
  category: string | null;
  requiredMastery: number;
  userState: 'LOCKED' | 'READY' | 'MASTERED';
  mastery: number;
  confidence: number;
}

interface GraphEdge {
  source: number;
  target: number;
  requiredMastery: number;
}

const toPercent = (value: number): number => Math.round(value * 100); // 0-1 -> 0-100

/** GET /:goalId - nodes and edges for one career goal */
router.get('/:goalId', async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  const goalId = Number(req.params.goalId);

  if (!userId) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  if (!Number.isInteger(goalId) || goalId <= 0) {
    res.status(400).json({ message: 'Valid goalId is required' });
    return;
  }

  try {
    const data = await loadGoalGraphData(userId, goalId);
    if (!data) {
      res.status(404).json({ message: 'Goal not found' });
      return;
    }

    const states = getSkillStates(data);
    const requiredBySkill = new Map(data.skills.map((skill) => [skill.skillId, skill.requiredMastery]));

    const nodes: GraphNode[] = data.skills.map((skill) => {
      const progress = data.progress.get(skill.skillId);
      return {
        id: skill.skillId,
        name: skill.name,
        category: skill.category,
        requiredMastery: toPercent(skill.requiredMastery),
        userState: states.get(skill.skillId) ?? 'LOCKED',
        mastery: toPercent(progress?.mastery ?? 0),
        confidence: toPercent(progress?.confidence ?? 0),
      };
    });

    // Edge value = the mastery the goal requires from the prerequisite
    const edges: GraphEdge[] = data.edges.map((edge) => ({
      source: edge.prerequisiteId,
      target: edge.skillId,
      requiredMastery: toPercent(requiredBySkill.get(edge.prerequisiteId) ?? 0),
    }));

    res.status(200).json({ nodes, edges });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;