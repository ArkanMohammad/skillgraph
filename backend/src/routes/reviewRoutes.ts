/**
 * Review routes (logged-in users):
 *   GET /   memory health of the mastered skills of the current goal (knowledge decay)
 * The route only translates HTTP <-> the review service.
 */
import { Router, Request, Response } from 'express';
import { authenticateJWT } from '../middleware/authMiddleware';
import { RecommendationError } from '../services/recommendationService';
import { getReviewQueue } from '../services/reviewService';

const router = Router();

router.use(authenticateJWT); // Protect all review routes

router.get('/', async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  try {
    res.status(200).json(await getReviewQueue(userId));
  } catch (err) {
    if (err instanceof RecommendationError) {
      res.status(err.status).json({ message: err.message });
      return;
    }
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;