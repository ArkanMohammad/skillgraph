/**
 * Assessment routes: start, answer, complete.
 */
import { Router, Request, Response } from 'express';
import { authenticateJWT } from '../middleware/authMiddleware';
import {
  AssessmentError,
  completeAssessment,
  startAssessment,
  submitAnswer,
} from '../services/assessmentService';

const router = Router();
router.use(authenticateJWT); // Protect all assessment routes / حماية كل مسارات التقييم

const isPositiveInt = (value: number): boolean => Number.isInteger(value) && value > 0;

/** Turns a service error into the right HTTP answer */
const sendError = (res: Response, err: unknown): void => {
  if (err instanceof AssessmentError) {
    res.status(err.status).json({ message: err.message });
    return;
  }
  console.error(err);
  res.status(500).json({ message: 'Server error' });
};

/** POST /start: starts (or resumes) an assessment and returns the first question */
router.post('/start', async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  const skillId = Number(req.body.skillId);

  if (!userId) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }
  if (!isPositiveInt(skillId)) {
    res.status(400).json({ message: 'Valid skillId is required' });
    return;
  }

  try {
    res.status(201).json(await startAssessment(userId, skillId));
  } catch (err) {
    sendError(res, err);
  }
});

/** POST /:assessmentId/answer: saves one answer and returns the next question */
router.post('/:assessmentId/answer', async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  const assessmentId = Number(req.params.assessmentId);
  const questionId = Number(req.body.questionId);
  const selectedOptionId = Number(req.body.selectedOptionId);

  if (!userId) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }
  if (![assessmentId, questionId, selectedOptionId].every(isPositiveInt)) {
    res.status(400).json({ message: 'assessmentId, questionId and selectedOptionId are required' });
    return;
  }

  try {
    res.status(200).json(await submitAnswer(userId, assessmentId, questionId, selectedOptionId));
  } catch (err) {
    sendError(res, err);
  }
});

/** POST /:assessmentId/complete: scores the assessment and updates the mastery */
router.post('/:assessmentId/complete', async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  const assessmentId = Number(req.params.assessmentId);

  if (!userId) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }
  if (!isPositiveInt(assessmentId)) {
    res.status(400).json({ message: 'Valid assessmentId is required' });
    return;
  }

  try {
    res.status(200).json(await completeAssessment(userId, assessmentId));
  } catch (err) {
    sendError(res, err);
  }
});

export default router;