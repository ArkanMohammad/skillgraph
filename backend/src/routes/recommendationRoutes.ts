/**
 * Recommendation routes: Next Best Skill with factor scores.
 * The route only translates HTTP <-> the recommendation service.
 */
import { Router, Request, Response } from 'express';
import { authenticateJWT } from '../middleware/authMiddleware';
import { RecommendationError, recommendNextSkill } from '../services/recommendationService';

const router = Router();

router.use(authenticateJWT); // Protect all recommendation routes

/** GET /next - ranked candidates for the current goal; the first one is the Next Best Skill */
router.get('/next', async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  try {
    const recommendation = await recommendNextSkill(userId);
    res.status(200).json(recommendation);
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