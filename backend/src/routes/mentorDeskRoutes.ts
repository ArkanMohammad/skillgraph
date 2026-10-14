/**
 * The desk of a mentor (role MENTOR only, checked again in the database):
 *   GET  /requests                           projects shared with me
 *   POST /requests/:shareId/recommendation   write and sign a recommendation
 *   POST /requests/:shareId/decline          decline, with an optional note
 */
import { Router, Request, Response } from 'express';
import { authenticateJWT, requireRole } from '../middleware/authMiddleware';
import { positiveIntParam } from '../middleware/validate';
import {
  ProjectShareError,
  declineRequest,
  listRequests,
  parseRecommendationInput,
  writeRecommendation,
} from '../services/projectShareService';

const router = Router();
router.use(authenticateJWT, requireRole('MENTOR'));

/** Turns a rule error into its HTTP answer, anything else into a 500 */
const fail = (err: unknown, res: Response): void => {
  if (err instanceof ProjectShareError) {
    res.status(err.status).json({ message: err.message });
    return;
  }
  console.error(err);
  res.status(500).json({ message: 'Server error' });
};

router.get('/requests', async (req: Request, res: Response): Promise<void> => {
  try {
    res.status(200).json({ requests: await listRequests(req.user!.id) });
  } catch (err) {
    fail(err, res);
  }
});

router.post(
  '/requests/:shareId/recommendation',
  positiveIntParam('shareId'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const code = await writeRecommendation(req.user!.id, Number(req.params.shareId), parseRecommendationInput(req.body));
      res.status(201).json({ code });
    } catch (err) {
      fail(err, res);
    }
  }
);

router.post(
  '/requests/:shareId/decline',
  positiveIntParam('shareId'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      await declineRequest(req.user!.id, Number(req.params.shareId), req.body);
      res.status(200).json({ message: 'Request declined' });
    } catch (err) {
      fail(err, res);
    }
  }
);

export default router;