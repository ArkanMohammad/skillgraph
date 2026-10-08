/**
 * Graph API: مهارات وروابط المتطلبات لـ React Flow
 * Graph API: skill nodes and prerequisite edges for React Flow
 */
import { Router, Request, Response } from 'express';
import { query } from '../config/db';
import { authenticateJWT } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticateJWT); // Protect graph routes / حماية مسارات المخطط

type UserState = 'LOCKED' | 'READY' | 'MASTERED';

interface GraphNode {
  id: number;
  name: string;
  category: string | null;
  requiredMastery: number;
  userState: UserState;
  mastery: number;
  confidence: number;
}

interface GraphEdge {
  source: number;
  target: number;
  requiredMastery: number;
}

interface SkillNodeRow {
  id: number;
  name: string;
  category: string | null;
  required_proficiency: string | number;
  mastery: string | number;
  confidence: string | number;
}

interface SkillEdgeRow {
  source: number;
  target: number;
  required_proficiency: string | number;
}

const toPercent = (value: string | number): number => Math.round(Number(value) * 100); // DB 0-1 → API 0-100

/** GET /:goalId — nodes and edges for one career goal / عقد وروابط هدف واحد */
router.get('/:goalId', async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  const goalId = Number(req.params.goalId);

  if (!userId) {
    res.status(401).json({ message: 'Unauthorized / غير مصرّح' });
    return;
  }

  if (!Number.isInteger(goalId) || goalId <= 0) {
    res.status(400).json({ message: 'Valid goalId is required / معرّف الهدف مطلوب' });
    return;
  }

  try {
    const goal = await query('SELECT id FROM goals WHERE id = $1', [goalId]);
    if (goal.rowCount === 0) {
      res.status(404).json({ message: 'Goal not found / الهدف غير موجود' });
      return;
    }

    // Skills of this goal + user mastery/confidence / مهارات الهدف وحالة المستخدم
    const nodeResult = await query<SkillNodeRow>(
      `SELECT
         s.id,
         s.name,
         s.category,
         gs.required_proficiency,
         COALESCE(us.proficiency_level, 0) AS mastery,
         COALESCE(us.confidence, 0) AS confidence
       FROM goal_skills gs
       JOIN skills s ON s.id = gs.skill_id
       LEFT JOIN user_skills us
         ON us.skill_id = s.id AND us.user_id = $1
       WHERE gs.goal_id = $2
       ORDER BY s.id`,
      [userId, goalId]
    );

    // Prerequisite edges inside this goal / روابط المتطلبات داخل الهدف
    const edgeResult = await query<SkillEdgeRow>(
      `SELECT
         sd.prerequisite_skill_id AS source,
         sd.skill_id AS target,
         prereq_gs.required_proficiency
       FROM skill_dependencies sd
       JOIN goal_skills prereq_gs
         ON prereq_gs.skill_id = sd.prerequisite_skill_id AND prereq_gs.goal_id = $1
       WHERE sd.skill_id IN (SELECT skill_id FROM goal_skills WHERE goal_id = $1)
         AND sd.prerequisite_skill_id IN (SELECT skill_id FROM goal_skills WHERE goal_id = $1)`,
      [goalId]
    );

    const edges: GraphEdge[] = edgeResult.rows.map((row) => ({
      source: row.source,
      target: row.target,
      requiredMastery: toPercent(row.required_proficiency),
    }));

    const prereqsBySkill = new Map<number, number[]>(); // target → sources / المهارة → متطلباتها
    for (const edge of edges) {
      const list = prereqsBySkill.get(edge.target) ?? [];
      list.push(edge.source);
      prereqsBySkill.set(edge.target, list);
    }

    const masteryById = new Map<number, { mastery: number; requiredMastery: number }>();
    for (const row of nodeResult.rows) {
      masteryById.set(row.id, {
        mastery: toPercent(row.mastery),
        requiredMastery: toPercent(row.required_proficiency),
      });
    }

    const isMastered = (skillId: number): boolean => {
      const data = masteryById.get(skillId);
      return !!data && data.mastery >= data.requiredMastery;
    };

    const nodes: GraphNode[] = nodeResult.rows.map((row) => {
      const mastery = toPercent(row.mastery);
      const requiredMastery = toPercent(row.required_proficiency);
      let userState: UserState;

      if (mastery >= requiredMastery) {
        userState = 'MASTERED';
      } else {
        const prereqs = prereqsBySkill.get(row.id) ?? [];
        // READY if no prereqs or all mastered / جاهزة إن اكتملت المتطلبات
        const unlocked = prereqs.every((prereqId) => isMastered(prereqId));
        userState = unlocked ? 'READY' : 'LOCKED';
      }

      return {
        id: row.id,
        name: row.name,
        category: row.category,
        requiredMastery,
        userState,
        mastery,
        confidence: toPercent(row.confidence),
      };
    });

    res.status(200).json({ nodes, edges });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error / حدث خطأ في الخادم' });
  }
});

export default router;
