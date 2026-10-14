/**
 * Mentor routes for the logged-in user:
 *   GET /mine   the mentors of the goal the user follows (names only)
 */
import { Router, Request, Response } from 'express';
import { authenticateJWT } from '../middleware/authMiddleware';
import { MentorError, getMyMentors } from '../services/mentorService';

const router = Router();
router.use(authenticateJWT);

router.get('/mine', async (req: Request, res: Response): Promise<void> => {
  try {
    res.status(200).json(await getMyMentors(req.user!.id));
  } catch (err) {
    if (err instanceof MentorError) {
      res.status(err.status).json({ message: err.message });
      return;
    }
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;