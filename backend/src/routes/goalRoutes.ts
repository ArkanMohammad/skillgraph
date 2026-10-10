/**
 * مسارات الأهداف المهنية واختيار الهدف النشط
 * Career goal routes and current-goal selection
 */
import { Router, Request, Response } from 'express';
import { pool, query } from '../config/db';
import { authenticateJWT } from '../middleware/authMiddleware';
import { Goal, UserGoal } from '../models';

const router = Router();

router.use(authenticateJWT); // Protect all goal routes / حماية كل مسارات الأهداف

/** GET / — list the seven goals / جلب قائمة الأهداف */
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await query<Goal>('SELECT id, name, description, created_at FROM goals ORDER BY id');
    res.status(200).json({ goals: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error / حدث خطأ في الخادم' });
  }
});

/** GET /current — the user's current goal, or null / الهدف الحالي للمستخدم أو null */
router.get('/current', async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({ message: 'Unauthorized / غير مصرّح' });
    return;
  }

  try {
    const result = await query<Goal>(
      `SELECT g.id, g.name, g.description, g.created_at
       FROM user_goals ug
       JOIN goals g ON g.id = ug.goal_id
       WHERE ug.user_id = $1 AND ug.is_current = TRUE
       LIMIT 1`,
      [userId]
    );
    res.status(200).json({ goal: result.rows[0] ?? null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error / حدث خطأ في الخادم' });
  }
});

/** PUT /select — set the user's current goal / حفظ أو تفعيل الهدف الحالي */
router.put('/select', async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  const goalId = Number(req.body.goalId);

  if (!userId) {
    res.status(401).json({ message: 'Unauthorized / غير مصرّح' });
    return;
  }

  if (!Number.isInteger(goalId) || goalId <= 0) {
    res.status(400).json({ message: 'Valid goalId is required / معرّف الهدف مطلوب' });
    return;
  }

  const client = await pool.connect(); // Transaction for one current goal / معاملة لهدف حالي واحد
  let started = false;

  try {
    const goal = await client.query<Goal>('SELECT id FROM goals WHERE id = $1', [goalId]);
    if (goal.rowCount === 0) {
      res.status(404).json({ message: 'Goal not found / الهدف غير موجود' });
      return;
    }

    await client.query('BEGIN');
    started = true;

    // Clear other current flags / إلغاء الأهداف الحالية الأخرى
    await client.query(
      `UPDATE user_goals
       SET is_current = FALSE,
           status = CASE WHEN status = 'ACTIVE' THEN 'PAUSED'::user_goal_status ELSE status END
       WHERE user_id = $1 AND is_current = TRUE AND goal_id <> $2`,
      [userId, goalId]
    );

    // Insert or reactivate as ACTIVE / إدخال أو إعادة تفعيل كـ ACTIVE
    const upserted = await client.query<UserGoal>(
      `INSERT INTO user_goals (user_id, goal_id, status, is_current, started_at, completed_at)
       VALUES ($1, $2, 'ACTIVE', TRUE, NOW(), NULL)
       ON CONFLICT (user_id, goal_id) DO UPDATE
       SET status = 'ACTIVE',
           is_current = TRUE,
           completed_at = NULL
       RETURNING user_id, goal_id, status, is_current, started_at, completed_at`,
      [userId, goalId]
    );

    await client.query('COMMIT');
    res.status(200).json({
      message: 'Current goal updated / تم تحديث الهدف الحالي',
      userGoal: upserted.rows[0],
    });
  } catch (err) {
    if (started) await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ message: 'Server error / حدث خطأ في الخادم' });
  } finally {
    client.release();
  }
});

export default router;