/**
 * Assessment business logic: start (or resume), answer, complete.
 * The routes only translate HTTP <-> these functions.
 */
import { pool, query } from '../config/db';
import { Difficulty, SkillState } from '../models';
import {
  AnsweredQuestion,
  PoolQuestion,
  pickNextQuestion,
  totalQuestionsFor,
} from './algorithm/adaptiveService';
import {
  ConceptInfo,
  ConceptResult,
  computeConfidence,
  decideState,
  scoreAssessment,
} from './algorithm/scoringService';

const DEFAULT_REQUIRED = 0.7; // Fallback mastery threshold

/** An error that carries the HTTP status code the route should answer with */
export class AssessmentError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export interface QuestionPayload {
  id: number;
  prompt: string;
  options: { id: number; text: string }[];
}

export interface StartResult {
  assessmentId: number;
  skillId: number;
  totalQuestions: number;
  answeredCount: number;
  finished: boolean;
  question: QuestionPayload | null;
}

export interface AnswerResult {
  finished: boolean;
  answeredCount: number;
  totalQuestions: number;
  question: QuestionPayload | null;
}

export interface CompleteResult {
  assessmentId: number;
  finalScore: number;
  correctAnswers: number;
  totalQuestions: number;
  mastery: number;
  requiredMastery: number;
  confidence: number;
  state: SkillState;
  concepts: ConceptResult[]; // Result per concept, weakest first
}

interface OpenAssessmentRow {
  id: number;
  user_id: string;
  skill_id: number;
  completed_at: Date | null;
}

const toNum = (value: string | number): number => Number(value);

/** All questions of a skill (only what the algorithm needs) */
const loadPool = async (skillId: number): Promise<PoolQuestion[]> => {
  const result = await query<{ id: number; concept_id: number | null; difficulty: Difficulty }>(
    'SELECT id, concept_id, difficulty FROM questions WHERE skill_id = $1 ORDER BY id',
    [skillId]
  );
  return result.rows.map((row) => ({
    id: row.id,
    conceptId: row.concept_id,
    difficulty: row.difficulty,
  }));
};

/** Answers of one assessment, oldest first (the order is needed to replay the difficulty) */
const loadAnswered = async (assessmentId: number): Promise<AnsweredQuestion[]> => {
  const result = await query<{
    question_id: number;
    concept_id: number | null;
    difficulty: Difficulty;
    is_correct: boolean;
  }>(
    `SELECT a.question_id, q.concept_id, q.difficulty, a.is_correct
     FROM assessment_answers a
     JOIN questions q ON q.id = a.question_id
     WHERE a.assessment_id = $1
     ORDER BY a.answered_at, a.question_id`,
    [assessmentId]
  );
  return result.rows.map((row) => ({
    id: row.question_id,
    conceptId: row.concept_id,
    difficulty: row.difficulty,
    isCorrect: row.is_correct,
  }));
};

/** The concepts of a skill with their weights */
const loadConcepts = async (skillId: number): Promise<ConceptInfo[]> => {
  const result = await query<{ id: number; name: string; weight: string | number }>(
    'SELECT id, name, weight FROM concepts WHERE skill_id = $1 ORDER BY id',
    [skillId]
  );
  return result.rows.map((row) => ({ id: row.id, name: row.name, weight: toNum(row.weight) }));
};

/** Question text and options WITHOUT the correct flag */
const loadQuestionPayload = async (questionId: number): Promise<QuestionPayload> => {
  const question = await query<{ id: number; prompt: string }>(
    'SELECT id, prompt FROM questions WHERE id = $1',
    [questionId]
  );
  const options = await query<{ id: number; option_text: string }>(
    'SELECT id, option_text FROM question_options WHERE question_id = $1 ORDER BY id',
    [questionId]
  );
  return {
    id: question.rows[0].id,
    prompt: question.rows[0].prompt,
    options: options.rows.map((row) => ({ id: row.id, text: row.option_text })),
  };
};

/** The assessment must exist, belong to the user and still be open */
const getOpenAssessment = async (userId: string, assessmentId: number): Promise<OpenAssessmentRow> => {
  const result = await query<OpenAssessmentRow>(
    'SELECT id, user_id, skill_id, completed_at FROM assessments WHERE id = $1',
    [assessmentId]
  );
  const session = result.rows[0];
  if (!session || session.user_id !== userId) {
    throw new AssessmentError(404, 'Assessment not found');
  }
  if (session.completed_at) {
    throw new AssessmentError(409, 'Assessment already completed');
  }
  return session;
};

/** Starts an assessment, or resumes the unfinished one for the same skill */
export const startAssessment = async (userId: string, skillId: number): Promise<StartResult> => {
  const skill = await query('SELECT id FROM skills WHERE id = $1', [skillId]);
  if (skill.rowCount === 0) throw new AssessmentError(404, 'Skill not found');

  const questionPool = await loadPool(skillId);
  if (questionPool.length === 0) throw new AssessmentError(400, 'No questions for this skill');

  const open = await query<{ id: number }>(
    `SELECT id FROM assessments
     WHERE user_id = $1 AND skill_id = $2 AND completed_at IS NULL
     ORDER BY id DESC LIMIT 1`,
    [userId, skillId]
  );

  let assessmentId: number;
  if (open.rowCount && open.rowCount > 0) {
    assessmentId = open.rows[0].id; // Resume
  } else {
    const created = await query<{ id: number }>(
      'INSERT INTO assessments (user_id, skill_id) VALUES ($1, $2) RETURNING id',
      [userId, skillId]
    );
    assessmentId = created.rows[0].id;
  }

  const answered = await loadAnswered(assessmentId);
  const totalQuestions = totalQuestionsFor(questionPool.length);
  const finished = answered.length >= totalQuestions;
  const next = finished ? null : pickNextQuestion(questionPool, answered);

  return {
    assessmentId,
    skillId,
    totalQuestions,
    answeredCount: answered.length,
    finished,
    question: next ? await loadQuestionPayload(next.id) : null,
  };
};

/** Saves one answer (checked on the server) and returns the next question */
export const submitAnswer = async (
  userId: string,
  assessmentId: number,
  questionId: number,
  selectedOptionId: number
): Promise<AnswerResult> => {
  const session = await getOpenAssessment(userId, assessmentId);
  const questionPool = await loadPool(session.skill_id);
  const answered = await loadAnswered(assessmentId);
  const totalQuestions = totalQuestionsFor(questionPool.length);

  if (answered.length >= totalQuestions) {
    throw new AssessmentError(409, 'All questions are answered, complete the assessment');
  }
  if (answered.some((item) => item.id === questionId)) {
    throw new AssessmentError(409, 'Question already answered');
  }

  // Only the question the algorithm chose can be answered
  const expected = pickNextQuestion(questionPool, answered);
  if (!expected || expected.id !== questionId) {
    throw new AssessmentError(400, 'This is not the current question');
  }

  const option = await query<{ is_correct: boolean }>(
    'SELECT is_correct FROM question_options WHERE id = $1 AND question_id = $2',
    [selectedOptionId, questionId]
  );
  if (option.rowCount === 0) {
    throw new AssessmentError(400, 'Option does not belong to this question');
  }
  const isCorrect = option.rows[0].is_correct;

  await query(
    `INSERT INTO assessment_answers (assessment_id, question_id, selected_option_id, is_correct)
     VALUES ($1, $2, $3, $4)`,
    [assessmentId, questionId, selectedOptionId, isCorrect]
  );

  const answeredNow: AnsweredQuestion[] = [...answered, { ...expected, isCorrect }];
  const finished = answeredNow.length >= totalQuestions;
  const next = finished ? null : pickNextQuestion(questionPool, answeredNow);

  return {
    finished,
    answeredCount: answeredNow.length,
    totalQuestions,
    question: next ? await loadQuestionPayload(next.id) : null,
  };
};

/**
 * Scores the assessment, updates the user's mastery and logs the event.
 * Score: difficulty weighted per concept, then combined with the concept weights.
 */
export const completeAssessment = async (
  userId: string,
  assessmentId: number
): Promise<CompleteResult> => {
  const session = await getOpenAssessment(userId, assessmentId);
  const questionPool = await loadPool(session.skill_id);
  const answered = await loadAnswered(assessmentId);

  if (answered.length < totalQuestionsFor(questionPool.length)) {
    throw new AssessmentError(409, 'Assessment is not finished yet');
  }

  const concepts = await loadConcepts(session.skill_id);
  const scored = scoreAssessment(answered, concepts);
  const finalScore = scored.finalScore; // 0-100
  const newMastery = finalScore / 100;
  const newConfidence = computeConfidence(answered, finalScore, scored.coverage);

  const requiredRow = await query<{ required_proficiency: string | number }>(
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

  const existing = await query<{ proficiency_level: string | number; confidence: string | number }>(
    'SELECT proficiency_level, confidence FROM user_skills WHERE user_id = $1 AND skill_id = $2',
    [userId, session.skill_id]
  );
  const prev = existing.rows[0];
  const prevMastery = prev ? toNum(prev.proficiency_level) : 0;
  const prevConfidence = prev ? toNum(prev.confidence) : 0;

  // A weaker attempt never lowers what the user already proved:
  // mastery and its confidence are kept together from the best attempt.
  const improved = newMastery >= prevMastery;
  const mastery = improved ? newMastery : prevMastery;
  const confidence = improved ? newConfidence : prevConfidence;

  const state = decideState(mastery, requiredMastery, confidence);

  const payload = {
    finalScore,
    mastery: Math.round(mastery * 100),
    requiredMastery: Math.round(requiredMastery * 100),
    confidence,
    state,
    concepts: scored.concepts,
  };

  // One transaction: either everything is saved or nothing
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      'UPDATE assessments SET final_score = $2, completed_at = NOW() WHERE id = $1',
      [assessmentId, finalScore]
    );

    await client.query(
      `INSERT INTO user_skills (user_id, skill_id, proficiency_level, confidence, state, last_assessed_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       ON CONFLICT (user_id, skill_id) DO UPDATE
       SET proficiency_level = EXCLUDED.proficiency_level,
           confidence = EXCLUDED.confidence,
           state = EXCLUDED.state,
           last_assessed_at = NOW(),
           updated_at = NOW()`,
      [userId, session.skill_id, mastery, confidence, state]
    );

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
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  return {
    assessmentId,
    finalScore,
    correctAnswers: scored.correctAnswers,
    totalQuestions: scored.totalQuestions,
    mastery: payload.mastery,
    requiredMastery: payload.requiredMastery,
    confidence,
    state,
    concepts: scored.concepts,
  };
};