/**
 * مسارات التقييم: بدء، إجابة، وإنهاء مع حساب التمكين
 * Assessment routes: start, answer, complete + mastery update
 */
import { Router, Request, Response } from 'express';
import { pool, query } from '../config/db';
import { authenticateJWT } from '../middleware/authMiddleware';
import { Assessment, SkillState, UserSkill } from '../models';

const router = Router();
router.use(authenticateJWT); // Protect all assessment routes / حماية كل مسارات التقييم

const MIN_CONFIDENCE = 0.7; // First documented confidence / أدنى ثقة بعد أول تقييم
const DEFAULT_REQUIRED = 0.7; // Fallback threshold / حد التمكن الافتراضي

interface QuestionRow {
  question_id: number;
  prompt: string;
  option_id: number;
  option_text: string;
}

interface OptionCheckRow {
  id: number;
  is_correct: boolean;
}

const toNum = (value: string | number): number => Number(value);

/** POST /start — create assessment and return questions without is_correct */
router.post('/start', async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  const skillId = Number(req.body.skillId);

  if (!userId) {
    res.status(401).json({ message: 'Unauthorized / غير مصرّح' });
    return;
  }

  if (!Number.isInteger(skillId) || skillId <= 0) {
    res.status(400).json({ message: 'Valid skillId is required / معرّف المهارة مطلوب' });
    return;
  }

  try {
    const skill = await query('SELECT id FROM skills WHERE id = $1', [skillId]);
    if (skill.rowCount === 0) {
      res.status(404).json({ message: 'Skill not found / المهارة غير موجودة' });
      return;
    }

    // Hide is_correct from the client / إخفاء الإجابة الصحيحة عن الفرونتند
    const questionRows = await query<QuestionRow>(
      `SELECT q.id AS question_id, q.prompt, o.id AS option_id, o.option_text
       FROM questions q
       JOIN question_options o ON o.question_id = q.id
       WHERE q.skill_id = $1
       ORDER BY q.id, o.id`,
      [skillId]
    );

    if (questionRows.rowCount === 0) {
      res.status(400).json({ message: 'No questions for this skill / لا توجد أسئلة لهذه المهارة' });
      return;
    }

    const created = await query<Assessment>(
      `INSERT INTO assessments (user_id, skill_id)
       VALUES ($1, $2)
       RETURNING id, user_id, skill_id, started_at, completed_at, final_score`,
      [userId, skillId]
    );

    const questionsMap = new Map<
      number,
      { id: number; prompt: string; options: { id: number; text: string }[] }
    >();

    for (const row of questionRows.rows) {
      const existing = questionsMap.get(row.question_id);
      const option = { id: row.option_id, text: row.option_text };
      if (existing) {
        existing.options.push(option);
      } else {
        questionsMap.set(row.question_id, {
          id: row.question_id,
          prompt: row.prompt,
          options: [option],
        });
      }
    }

    res.status(201).json({
      assessmentId: created.rows[0].id,
      skillId,
      questions: Array.from(questionsMap.values()),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error / حدث خطأ في الخادم' });
  }
});

/** POST /:assessmentId/answer — save one answer after server-side check */
router.post('/:assessmentId/answer', async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  const assessmentId = Number(req.params.assessmentId);
  const questionId = Number(req.body.questionId);
  const selectedOptionId = Number(req.body.selectedOptionId);

  if (!userId) {
    res.status(401).json({ message: 'Unauthorized / غير مصرّح' });
    return;
  }

  if (![assessmentId, questionId, selectedOptionId].every((n) => Number.isInteger(n) && n > 0)) {
    res.status(400).json({
      message: 'assessmentId, questionId, and selectedOptionId are required / القيم المطلوبة ناقصة',
    });
    return;
  }

  try {
    const assessment = await query<Assessment>(
      `SELECT id, user_id, skill_id, completed_at
       FROM assessments
       WHERE id = $1`,
      [assessmentId]
    );
    const session = assessment.rows[0];

    if (!session || session.user_id !== userId) {
      res.status(404).json({ message: 'Assessment not found / التقييم غير موجود' });
      return;
    }

    if (session.completed_at) {
      res.status(409).json({ message: 'Assessment already completed / التقييم مكتمل مسبقاً' });
      return;
    }

    const question = await query(
      'SELECT id FROM questions WHERE id = $1 AND skill_id = $2',
      [questionId, session.skill_id]
    );
    if (question.rowCount === 0) {
      res.status(400).json({ message: 'Question does not belong to this skill / السؤال لا يتبع هذه المهارة' });
      return;
    }

    // Compare against the real correct flag / المقارنة مع الإجابة الصحيحة في السيرفر
    const option = await query<OptionCheckRow>(
      'SELECT id, is_correct FROM question_options WHERE id = $1 AND question_id = $2',
      [selectedOptionId, questionId]
    );
    if (option.rowCount === 0) {
      res.status(400).json({ message: 'Option does not belong to this question / الخيار لا يتبع هذا السؤال' });
      return;
    }

    const isCorrect = option.rows[0].is_correct;

    await query(
      `INSERT INTO assessment_answers (assessment_id, question_id, selected_option_id, is_correct)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (assessment_id, question_id) DO UPDATE
       SET selected_option_id = EXCLUDED.selected_option_id,
           is_correct = EXCLUDED.is_correct,
           answered_at = NOW()`,
      [assessmentId, questionId, selectedOptionId, isCorrect]
    );

    res.status(200).json({ message: 'Answer saved / تم حفظ الإجابة' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error / حدث خطأ في الخادم' });
  }
});

/** POST /:assessmentId/complete — score, update mastery, log event */
router.post('/:assessmentId/complete', async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  const assessmentId = Number(req.params.assessmentId);

  if (!userId) {
    res.status(401).json({ message: 'Unauthorized / غير مصرّح' });
    return;
  }

  if (!Number.isInteger(assessmentId) || assessmentId <= 0) {
    res.status(400).json({ message: 'Valid assessmentId is required / معرّف التقييم مطلوب' });
    return;
  }

  const client = await pool.connect();
  let started = false;

  try {
    const assessment = await client.query<Assessment>(
      `SELECT id, user_id, skill_id, completed_at, final_score
       FROM assessments
       WHERE id = $1`,
      [assessmentId]
    );
    const session = assessment.rows[0];

    if (!session || session.user_id !== userId) {
      res.status(404).json({ message: 'Assessment not found / التقييم غير موجود' });
      return;
    }

    if (session.completed_at) {
      res.status(409).json({ message: 'Assessment already completed / التقييم مكتمل مسبقاً' });
      return;
    }

    const totals = await client.query<{ total: string; correct: string }>(
      `SELECT
         (SELECT COUNT(*) FROM questions WHERE skill_id = $1) AS total,
         (SELECT COUNT(*) FROM assessment_answers WHERE assessment_id = $2 AND is_correct = TRUE) AS correct`,
      [session.skill_id, assessmentId]
    );

    const totalQuestions = Number(totals.rows[0].total);
    const correctAnswers = Number(totals.rows[0].correct);

    if (totalQuestions === 0) {
      res.status(400).json({ message: 'No questions for this skill / لا توجد أسئلة لهذه المهارة' });
      return;
    }

    const finalScore = Math.round((correctAnswers / totalQuestions) * 100); // Score 0-100 / النتيجة

    const requiredRow = await client.query<{ required_proficiency: string | number }>(
      `SELECT gs.required_proficiency
       FROM user_goals ug
       JOIN goal_skills gs ON gs.goal_id = ug.goal_id AND gs.skill_id = $2
       WHERE ug.user_id = $1 AND ug.is_current = TRUE
       LIMIT 1`,
      [userId, session.skill_id]
    );
    const requiredMastery = requiredRow.rows[0]
      ? toNum(requiredRow.rows[0].required_proficiency)
      : DEFAULT_REQUIRED;

    const existing = await client.query<UserSkill>(
      `SELECT proficiency_level, confidence, state
       FROM user_skills
       WHERE user_id = $1 AND skill_id = $2`,
      [userId, session.skill_id]
    );
    const prev = existing.rows[0];
    const prevMastery = prev ? toNum(prev.proficiency_level) : 0;
    const prevConfidence = prev ? toNum(prev.confidence) : 0;

    const mastery = Math.max(prevMastery, finalScore / 100); // Keep best mastery / الإبقاء على أعلى تمكين
    const confidence = Math.max(prevConfidence, MIN_CONFIDENCE); // Min 0.70 after first test / حد أدنى بعد أول تقييم

    let state: SkillState;
    if (mastery >= requiredMastery && confidence >= MIN_CONFIDENCE) {
      state = 'MASTERED';
    } else if (prev) {
      state = 'PRACTICING';
    } else {
      state = 'LEARNING';
    }

    await client.query('BEGIN');
    started = true;

    await client.query(
      `UPDATE assessments
       SET final_score = $2, completed_at = NOW()
       WHERE id = $1`,
      [assessmentId, finalScore]
    );

    await client.query(
      `INSERT INTO user_skills (user_id, skill_id, proficiency_level, confidence, state, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (user_id, skill_id) DO UPDATE
       SET proficiency_level = EXCLUDED.proficiency_level,
           confidence = EXCLUDED.confidence,
           state = EXCLUDED.state,
           updated_at = NOW()`,
      [userId, session.skill_id, mastery, confidence, state]
    );

    const payload = {
      finalScore,
      mastery: Math.round(mastery * 100),
      requiredMastery: Math.round(requiredMastery * 100),
      confidence,
      state,
    };

    await client.query(
      `INSERT INTO skill_events (user_id, skill_id, assessment_id, event_type, payload)
       VALUES ($1, $2, $3, $4, $5::jsonb)`,
      [userId, session.skill_id, assessmentId, 'ASSESSMENT_COMPLETED', JSON.stringify(payload)]
    );

    if (state === 'MASTERED') {
      await client.query(
        `INSERT INTO skill_events (user_id, skill_id, assessment_id, event_type, payload)
         VALUES ($1, $2, $3, $4, $5::jsonb)`,
        [userId, session.skill_id, assessmentId, 'SKILL_MASTERED', JSON.stringify(payload)]
      );
    }

    await client.query('COMMIT');

    res.status(200).json({
      assessmentId,
      finalScore,
      correctAnswers,
      totalQuestions,
      mastery: Math.round(mastery * 100),
      requiredMastery: Math.round(requiredMastery * 100),
      confidence,
      state,
    });
  } catch (err) {
    if (started) await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ message: 'Server error / حدث خطأ في الخادم' });
  } finally {
    client.release();
  }
});

export default router;
