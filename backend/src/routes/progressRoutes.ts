/**
 * Progress API (logged-in users):
 *   GET /        progress of the current goal (summary, categories, recent assessments)
 *   GET /goals   progress in every goal (used by the "change goal" screen)
 */
import { Router, Request, Response } from 'express';
import { authenticateJWT } from '../middleware/authMiddleware';
import { getProgressOverview, progressForAllGoals } from '../services/progressService';

const router = Router();
router.use(authenticateJWT); // Protect all progress routes

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const overview = await getProgressOverview(req.user!.id);
    if (!overview) {
      res.status(400).json({ message: 'Select a goal first' });
      return;
    }
    res.status(200).json(overview);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/goals', async (req: Request, res: Response): Promise<void> => {
  try {
    res.status(200).json({ goals: await progressForAllGoals(req.user!.id) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;