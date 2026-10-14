/**
 * Public verification of a recommendation (no login needed, so an employer can check a code):
 *   GET /:code   the recommendation behind a code such as SG-7KQ2-M9XD-4TPA
 * It shows only what is on the paper: no email and no project description.
 */
import { Router, Request, Response } from 'express';
import { ProjectShareError } from '../services/projectShareService';
import { verifyRecommendation } from '../services/verifyService';

const router = Router();

router.get('/:code', async (req: Request, res: Response): Promise<void> => {
  try {
    const recommendation = await verifyRecommendation(req.params.code);
    res.status(200).json({ valid: true, recommendation });
  } catch (err) {
    if (err instanceof ProjectShareError) {
      res.status(err.status).json({ message: err.message });
      return;
    }
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;