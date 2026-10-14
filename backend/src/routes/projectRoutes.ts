/**
 * Project routes for the logged-in learner:
 *   POST   /           share a project with a mentor of the current goal
 *   GET    /mine       my projects, with the recommendation when there is one
 *   DELETE /:shareId   take back a project that is waiting or was declined
 */
import { Router, Request, Response } from 'express';
import { authenticateJWT } from '../middleware/authMiddleware';
import { positiveIntParam } from '../middleware/validate';
import {
  ProjectShareError,
  cancelShare,
  createShare,
  listMyShares,
  parseShareInput,
} from '../services/projectShareService';

const router = Router();
router.use(authenticateJWT);

/** Turns a rule error into its HTTP answer, anything else into a 500 */
const fail = (err: unknown, res: Response): void => {
  if (err instanceof ProjectShareError) {
    res.status(err.status).json({ message: err.message });
    return;
  }
  console.error(err);
  res.status(500).json({ message: 'Server error' });
};

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = await createShare(req.user!.id, parseShareInput(req.body));
    res.status(201).json({ id });
  } catch (err) {
    fail(err, res);
  }
});

router.get('/mine', async (req: Request, res: Response): Promise<void> => {
  try {
    res.status(200).json({ projects: await listMyShares(req.user!.id) });
  } catch (err) {
    fail(err, res);
  }
});

router.delete('/:shareId', positiveIntParam('shareId'), async (req: Request, res: Response): Promise<void> => {
  try {
    await cancelShare(req.user!.id, Number(req.params.shareId));
    res.status(204).send();
  } catch (err) {
    fail(err, res);
  }
});

export default router;