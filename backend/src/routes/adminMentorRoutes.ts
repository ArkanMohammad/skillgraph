/**
 * Admin mentor routes (mounted inside adminRoutes, so every route is already ADMIN only).
 *   GET    /mentors                        every mentor with the goals they look after
 *   PUT    /goals/:goalId/mentors/:mentorId  assign a mentor to a goal
 *   DELETE /goals/:goalId/mentors/:mentorId  remove a mentor from a goal
 */
import { Router, Request, Response } from 'express';
import { positiveIntParam, uuidParam } from '../middleware/validate';
import { MentorError, assignMentor, listMentors, removeMentor } from '../services/mentorService';

const router = Router();

const fail = (err: unknown, res: Response): void => {
  if (err instanceof MentorError) {
    res.status(err.status).json({ message: err.message });
    return;
  }
  console.error(err);
  res.status(500).json({ message: 'Server error' });
};

router.get('/mentors', async (_req: Request, res: Response): Promise<void> => {
  try {
    res.status(200).json({ mentors: await listMentors() });
  } catch (err) {
    fail(err, res);
  }
});

router.put(
  '/goals/:goalId/mentors/:mentorId',
  positiveIntParam('goalId'),
  uuidParam('mentorId'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const created = await assignMentor(Number(req.params.goalId), req.params.mentorId);
      res.status(created ? 201 : 200).json({ created });
    } catch (err) {
      fail(err, res);
    }
  }
);

router.delete(
  '/goals/:goalId/mentors/:mentorId',
  positiveIntParam('goalId'),
  uuidParam('mentorId'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      await removeMentor(Number(req.params.goalId), req.params.mentorId);
      res.status(204).send();
    } catch (err) {
      fail(err, res);
    }
  }
);

export default router;