/**
 * Advice API for the logged-in user (advice is written by admins, see adminUserRoutes.ts):
 *   GET   /                the newest advice messages and how many are unread
 *   PATCH /read-all        mark all advice as read
 *   PATCH /:adviceId/read  mark one advice as read
 */
import { Router, Request, Response } from 'express';
import { authenticateJWT } from '../middleware/authMiddleware';
import { positiveIntParam } from '../middleware/validate';
import {
  AdviceError,
  countUnreadAdvice,
  listAdvice,
  markAdviceRead,
  markAllAdviceRead,
} from '../services/adviceService';

const router = Router();
router.use(authenticateJWT);

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const [advice, unread] = await Promise.all([listAdvice(req.user!.id), countUnreadAdvice(req.user!.id)]);
    res.status(200).json({ advice, unread });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.patch('/read-all', async (req: Request, res: Response): Promise<void> => {
  try {
    const marked = await markAllAdviceRead(req.user!.id);
    res.status(200).json({ marked });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.patch('/:adviceId/read', positiveIntParam('adviceId'), async (req: Request, res: Response): Promise<void> => {
  try {
    await markAdviceRead(req.user!.id, Number(req.params.adviceId));
    res.status(200).json({ message: 'Marked as read' });
  } catch (err) {
    if (err instanceof AdviceError) {
      res.status(err.status).json({ message: err.message });
      return;
    }
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;