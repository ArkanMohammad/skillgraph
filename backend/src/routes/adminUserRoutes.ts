/**
 * Admin user routes (mounted inside adminRoutes, so every route is already ADMIN only).
 *
 *   GET    /users/:userId          profile, progress, skills and advice of one user
 *   DELETE /users/:userId          delete a user and all their data
 *   POST   /users/:userId/advice   write an advice for a user (shown on their dashboard)
 */
import { Router, Request, Response } from 'express';
import { uuidParam } from '../middleware/validate';
import { AdviceError, createAdvice, parseAdviceInput } from '../services/adviceService';
import { AdminUserError, deleteUser, getUserDetail } from '../services/adminUsersService';

const router = Router();

/** Runs a handler and turns a service error into the right HTTP answer */
const handle =
  (work: (req: Request, res: Response) => Promise<void>) =>
  async (req: Request, res: Response): Promise<void> => {
    try {
      await work(req, res);
    } catch (err) {
      if (err instanceof AdminUserError || err instanceof AdviceError) {
        res.status(err.status).json({ message: err.message });
        return;
      }
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  };

router.get('/users/:userId', uuidParam('userId'), handle(async (req, res) => {
  res.status(200).json(await getUserDetail(req.params.userId as string));
}));

router.delete('/users/:userId', uuidParam('userId'), handle(async (req, res) => {
  const removed = await deleteUser(req.user!.id, req.params.userId as string);
  res.status(200).json({ message: `${removed.name} was deleted` });
}));

router.post('/users/:userId/advice', uuidParam('userId'), handle(async (req, res) => {
  const message = parseAdviceInput(req.body);
  const advice = await createAdvice(req.user!.id, req.params.userId as string, message);
  res.status(201).json(advice);
}));

export default router;