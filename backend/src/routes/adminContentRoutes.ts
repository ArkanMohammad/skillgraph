/**
 * Admin content routes (mounted inside adminRoutes, so every route is already ADMIN only).
 *
 *   GET    /skills                          all skills with question counts and concepts
 *   POST   /skills                          create a skill
 *   PUT    /skills/:skillId                 edit name, category, description
 *   GET    /skills/:skillId/questions       all questions of a skill (with the right answers)
 *   POST   /skills/:skillId/questions       add a question
 *   PUT    /questions/:questionId           edit a question
 *   PATCH  /questions/:questionId/active    show or hide a question
 *   GET    /goals/:goalId/skills            skills of a goal + skills that can be added
 *   POST   /goals/:goalId/skills            add a skill to a goal
 *   PUT    /goals/:goalId/skills/:skillId   edit mastery threshold, importance, hours
 *   DELETE /goals/:goalId/skills/:skillId   remove a skill from a goal
 */
import { Router, Request, Response } from 'express';
import { positiveIntBody, positiveIntParam } from '../middleware/validate';
import {
  AdminContentError,
  addSkillToGoal,
  createQuestion,
  createSkill,
  getGoalSkills,
  listQuestions,
  listSkills,
  parseGoalSkillInput,
  parseQuestionInput,
  parseSkillInput,
  removeSkillFromGoal,
  setQuestionActive,
  updateGoalSkill,
  updateQuestion,
  updateSkill,
} from '../services/adminContentService';

const router = Router();

/** Runs a handler and turns a service error into the right HTTP answer */
const handle =
  (work: (req: Request, res: Response) => Promise<void>) =>
  async (req: Request, res: Response): Promise<void> => {
    try {
      await work(req, res);
    } catch (err) {
      if (err instanceof AdminContentError) {
        res.status(err.status).json({ message: err.message });
        return;
      }
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  };

// ---------- Skills ----------

router.get('/skills', handle(async (_req, res) => {
  res.status(200).json({ skills: await listSkills() });
}));

router.post('/skills', handle(async (req, res) => {
  res.status(201).json(await createSkill(parseSkillInput(req.body)));
}));

router.put('/skills/:skillId', positiveIntParam('skillId'), handle(async (req, res) => {
  await updateSkill(Number(req.params.skillId), parseSkillInput(req.body));
  res.status(204).send();
}));

// ---------- Questions ----------

router.get('/skills/:skillId/questions', positiveIntParam('skillId'), handle(async (req, res) => {
  res.status(200).json({ questions: await listQuestions(Number(req.params.skillId)) });
}));

router.post('/skills/:skillId/questions', positiveIntParam('skillId'), handle(async (req, res) => {
  res.status(201).json(await createQuestion(Number(req.params.skillId), parseQuestionInput(req.body)));
}));

router.put('/questions/:questionId', positiveIntParam('questionId'), handle(async (req, res) => {
  await updateQuestion(Number(req.params.questionId), parseQuestionInput(req.body));
  res.status(204).send();
}));

router.patch('/questions/:questionId/active', positiveIntParam('questionId'), handle(async (req, res) => {
  if (typeof req.body?.isActive !== 'boolean') {
    throw new AdminContentError(400, 'isActive must be true or false');
  }
  await setQuestionActive(Number(req.params.questionId), req.body.isActive);
  res.status(204).send();
}));

// ---------- Skills of a goal ----------

router.get('/goals/:goalId/skills', positiveIntParam('goalId'), handle(async (req, res) => {
  res.status(200).json(await getGoalSkills(Number(req.params.goalId)));
}));

router.post('/goals/:goalId/skills', positiveIntParam('goalId'), positiveIntBody('skillId'), handle(async (req, res) => {
  await addSkillToGoal(Number(req.params.goalId), Number(req.body.skillId), parseGoalSkillInput(req.body));
  res.status(201).json({ message: 'Skill added to the goal' });
}));

router.put('/goals/:goalId/skills/:skillId', positiveIntParam('goalId', 'skillId'), handle(async (req, res) => {
  await updateGoalSkill(Number(req.params.goalId), Number(req.params.skillId), parseGoalSkillInput(req.body));
  res.status(204).send();
}));

router.delete('/goals/:goalId/skills/:skillId', positiveIntParam('goalId', 'skillId'), handle(async (req, res) => {
  res.status(200).json(await removeSkillFromGoal(Number(req.params.goalId), Number(req.params.skillId)));
}));

export default router;