/**
 * Admin API (role ADMIN only). Two checks run before every route:
 *   1. authenticateJWT -> 401 when the user is not logged in
 *   2. requireRole('ADMIN') -> 403 when the user is logged in but is not an admin
 *
 *   GET /stats                  totals for the admin overview
 *   GET /users?limit=&offset=   users with their current goal
 *   PUT /users/:userId/role     change a role (an admin cannot change their own role)
 *   ...content routes           skills, questions and goal skills (see adminContentRoutes.ts)
 */
import { Router, Request, Response } from 'express';
import { query } from '../config/db';
import { authenticateJWT, requireRole } from '../middleware/authMiddleware';
import { isPositiveInt, uuidParam } from '../middleware/validate';
import adminContentRoutes from './adminContentRoutes';

const router = Router();
router.use(authenticateJWT, requireRole('ADMIN'));

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;
const ROLES = ['USER', 'ADMIN'];

/** GET /stats: counters and the number of users per goal */
router.get('/stats', async (_req: Request, res: Response): Promise<void> => {
  try {
    const totals = await query<{
      users: number;
      admins: number;
      assessments_completed: number;
      average_score: string | null;
    }>(
      `SELECT (SELECT COUNT(*) FROM users)::int AS users,
              (SELECT COUNT(*) FROM users WHERE role = 'ADMIN')::int AS admins,
              (SELECT COUNT(*) FROM assessments WHERE completed_at IS NOT NULL)::int AS assessments_completed,
              (SELECT ROUND(AVG(final_score), 1) FROM assessments WHERE completed_at IS NOT NULL) AS average_score`
    );

    const perGoal = await query<{ goal_id: number; name: string; users: number }>(
      `SELECT g.id AS goal_id, g.name, COUNT(ug.user_id)::int AS users
       FROM goals g
       LEFT JOIN user_goals ug ON ug.goal_id = g.id AND ug.is_current = TRUE
       GROUP BY g.id, g.name
       ORDER BY g.id`
    );

    const row = totals.rows[0];
    res.status(200).json({
      users: row.users,
      admins: row.admins,
      assessmentsCompleted: row.assessments_completed,
      averageScore: row.average_score === null ? null : Number(row.average_score),
      usersPerGoal: perGoal.rows.map((goal) => ({
        goalId: goal.goal_id,
        name: goal.name,
        users: goal.users,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

/** GET /users: newest first, with paging */
router.get('/users', async (req: Request, res: Response): Promise<void> => {
  const limit = req.query.limit === undefined ? DEFAULT_LIMIT : req.query.limit;
  const offset = req.query.offset === undefined ? 0 : req.query.offset;

  if (!isPositiveInt(limit) || Number(limit) > MAX_LIMIT) {
    res.status(400).json({ message: `limit must be a positive integer up to ${MAX_LIMIT}` });
    return;
  }
  if (Number(offset) < 0 || !Number.isInteger(Number(offset)) || String(offset).trim() === '') {
    res.status(400).json({ message: 'offset must be 0 or a positive integer' });
    return;
  }

  try {
    const total = await query<{ total: number }>('SELECT COUNT(*)::int AS total FROM users');
    const users = await query<{
      id: string;
      name: string;
      email: string;
      role: string;
      created_at: Date;
      goal_name: string | null;
      assessments: number;
    }>(
      `SELECT u.id, u.name, u.email, u.role, u.created_at,
              g.name AS goal_name,
              (SELECT COUNT(*) FROM assessments a
               WHERE a.user_id = u.id AND a.completed_at IS NOT NULL)::int AS assessments
       FROM users u
       LEFT JOIN user_goals ug ON ug.user_id = u.id AND ug.is_current = TRUE
       LEFT JOIN goals g ON g.id = ug.goal_id
       ORDER BY u.created_at DESC
       LIMIT $1 OFFSET $2`,
      [Number(limit), Number(offset)]
    );

    res.status(200).json({
      total: total.rows[0].total,
      users: users.rows.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: new Date(user.created_at).toISOString(),
        currentGoal: user.goal_name,
        assessmentsCompleted: user.assessments,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

/** PUT /users/:userId/role: promote or demote a user */
router.put('/users/:userId/role', uuidParam('userId'), async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;
  const role = typeof req.body?.role === 'string' ? req.body.role : '';

  if (!ROLES.includes(role)) {
    res.status(400).json({ message: `role must be one of: ${ROLES.join(', ')}` });
    return;
  }
  // Prevents locking the last admin out of the system
  if (userId === req.user!.id) {
    res.status(400).json({ message: 'You cannot change your own role' });
    return;
  }

  try {
    const updated = await query<{ id: string; name: string; email: string; role: string }>(
      `UPDATE users SET role = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, name, email, role`,
      [role, userId]
    );
    if (updated.rowCount === 0) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.status(200).json(updated.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.use(adminContentRoutes); // Skills, questions and goal skills (ADMIN only, same guards)

export default router;