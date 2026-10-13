/**
 * Admin content management: skills, questions and the skills of a goal.
 * The routes only translate HTTP <-> these functions.
 *
 * Rules that protect the data:
 *  - Nothing that users produced is deleted. A question is hidden (is_active = FALSE), and a skill
 *    is removed from a goal only (the progress of users is stored per skill, so it stays).
 *  - A skill needs at least QUESTIONS_PER_ASSESSMENT active questions, otherwise it cannot be tested.
 *  - A skill can only be added to a goal when it can be tested.
 *  - Prerequisites are edited per goal, but the link is shared by every goal that contains both skills,
 *    and a change that would create a cycle is refused.
 */
import { pool, query } from '../config/db';
import { QUESTIONS_PER_ASSESSMENT } from './algorithm/adaptiveService';

export const MIN_ACTIVE_QUESTIONS = QUESTIONS_PER_ASSESSMENT;
export const OPTIONS_PER_QUESTION = 4;

const MIN_REQUIRED_MASTERY = 0.5;
const MAX_HOURS = 1000;
const NAME_MAX = 150;
const CATEGORY_MAX = 100;
const DESCRIPTION_MAX = 1000;
const PROMPT_MAX = 500;
const OPTION_MAX = 300;

/** An error that carries the HTTP status code the route should answer with */
export class AdminContentError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/** PostgreSQL error code of a failed query (23505 = duplicate, 23503 = missing parent row) */
const pgCode = (err: unknown): string | undefined => (err as { code?: string } | null)?.code;

/** Runs the work in one transaction: all of it is saved, or none of it */
const inTransaction = async <T>(work: (run: typeof query) => Promise<T>): Promise<T> => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await work(client.query.bind(client) as typeof query);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

// ---------------------------------------------------------------------------
// Input checks (each returns clean values or throws a 400)
// ---------------------------------------------------------------------------

const cleanText = (value: unknown, label: string, max: number, required = true): string => {
  const text = typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';
  if (required && text.length === 0) throw new AdminContentError(400, `${label} is required`);
  if (text.length > max) throw new AdminContentError(400, `${label} must be at most ${max} characters`);
  return text;
};

const cleanNumber = (value: unknown, label: string, min: number, max: number, integer = false): number => {
  if (typeof value !== 'number' || !Number.isFinite(value) || (integer && !Number.isInteger(value))) {
    throw new AdminContentError(400, `${label} must be ${integer ? 'a whole' : 'a'} number`);
  }
  if (value < min || value > max) throw new AdminContentError(400, `${label} must be between ${min} and ${max}`);
  return integer ? value : Math.round(value * 100) / 100; // The columns keep 2 decimals
};

export interface SkillInput {
  name: string;
  category: string;
  description: string;
}

export const parseSkillInput = (body: Record<string, unknown> | undefined): SkillInput => ({
  name: cleanText(body?.name, 'name', NAME_MAX),
  category: cleanText(body?.category, 'category', CATEGORY_MAX),
  description: cleanText(body?.description, 'description', DESCRIPTION_MAX, false),
});

export interface QuestionInput {
  conceptId: number;
  difficulty: 1 | 2 | 3;
  prompt: string;
  options: { text: string; isCorrect: boolean }[];
}

export const parseQuestionInput = (body: Record<string, unknown> | undefined): QuestionInput => {
  const conceptId = cleanNumber(body?.conceptId, 'conceptId', 1, 2147483647, true);
  const difficulty = cleanNumber(body?.difficulty, 'difficulty', 1, 3, true) as 1 | 2 | 3;
  const prompt = cleanText(body?.prompt, 'prompt', PROMPT_MAX);

  const rawOptions = body?.options;
  if (!Array.isArray(rawOptions) || rawOptions.length !== OPTIONS_PER_QUESTION) {
    throw new AdminContentError(400, `options must contain exactly ${OPTIONS_PER_QUESTION} answers`);
  }
  const options = rawOptions.map((item, index) => {
    const option = item as { text?: unknown; isCorrect?: unknown } | null;
    if (typeof option?.isCorrect !== 'boolean') {
      throw new AdminContentError(400, `options[${index}].isCorrect must be true or false`);
    }
    return { text: cleanText(option.text, `options[${index}].text`, OPTION_MAX), isCorrect: option.isCorrect };
  });

  if (options.filter((option) => option.isCorrect).length !== 1) {
    throw new AdminContentError(400, 'Exactly one option must be correct');
  }
  const distinct = new Set(options.map((option) => option.text.toLowerCase()));
  if (distinct.size !== OPTIONS_PER_QUESTION) {
    throw new AdminContentError(400, 'The options must be different from each other');
  }

  return { conceptId, difficulty, prompt, options };
};

export interface GoalSkillInput {
  requiredMastery: number;
  importance: number;
  estimatedHours: number;
}

export const parseGoalSkillInput = (body: Record<string, unknown> | undefined): GoalSkillInput => ({
  requiredMastery: cleanNumber(body?.requiredMastery, 'requiredMastery', MIN_REQUIRED_MASTERY, 1),
  importance: cleanNumber(body?.importance, 'importance', 0.01, 1),
  estimatedHours: cleanNumber(body?.estimatedHours, 'estimatedHours', 1, MAX_HOURS, true),
});

// ---------------------------------------------------------------------------
// Skills
// ---------------------------------------------------------------------------

export interface AdminSkill {
  id: number;
  name: string;
  category: string | null;
  description: string | null;
  activeQuestions: number;
  totalQuestions: number;
  goals: number;
  concepts: { id: number; name: string; weight: number }[];
}

/** Every skill with its question counts and its concepts */
export const listSkills = async (): Promise<AdminSkill[]> => {
  const skills = await query<{
    id: number;
    name: string;
    category: string | null;
    description: string | null;
    active_questions: number;
    total_questions: number;
    goals: number;
  }>(
    `SELECT s.id, s.name, s.category, s.description,
            (SELECT COUNT(*) FROM questions q WHERE q.skill_id = s.id AND q.is_active)::int AS active_questions,
            (SELECT COUNT(*) FROM questions q WHERE q.skill_id = s.id)::int AS total_questions,
            (SELECT COUNT(*) FROM goal_skills gs WHERE gs.skill_id = s.id)::int AS goals
     FROM skills s
     ORDER BY s.name`
  );
  const concepts = await query<{ id: number; skill_id: number; name: string; weight: string | number }>(
    'SELECT id, skill_id, name, weight FROM concepts ORDER BY skill_id, id'
  );

  return skills.rows.map((skill) => ({
    id: skill.id,
    name: skill.name,
    category: skill.category,
    description: skill.description,
    activeQuestions: skill.active_questions,
    totalQuestions: skill.total_questions,
    goals: skill.goals,
    concepts: concepts.rows
      .filter((concept) => concept.skill_id === skill.id)
      .map((concept) => ({ id: concept.id, name: concept.name, weight: Number(concept.weight) })),
  }));
};

/** Creates a skill with one "General" concept (weight 1), so questions can be attached to it */
export const createSkill = async (input: SkillInput): Promise<{ id: number }> => {
  try {
    return await inTransaction(async (run) => {
      const skill = await run<{ id: number }>(
        'INSERT INTO skills (name, category, description) VALUES ($1, $2, $3) RETURNING id',
        [input.name, input.category, input.description || null]
      );
      await run("INSERT INTO concepts (skill_id, name, weight) VALUES ($1, 'General', 1)", [skill.rows[0].id]);
      return { id: skill.rows[0].id };
    });
  } catch (err) {
    if (pgCode(err) === '23505') throw new AdminContentError(409, 'A skill with this name already exists');
    throw err;
  }
};

/** Edits the text fields of a skill */
export const updateSkill = async (skillId: number, input: SkillInput): Promise<void> => {
  try {
    const result = await query(
      'UPDATE skills SET name = $1, category = $2, description = $3 WHERE id = $4 RETURNING id',
      [input.name, input.category, input.description || null, skillId]
    );
    if (result.rows.length === 0) throw new AdminContentError(404, 'Skill not found');
  } catch (err) {
    if (pgCode(err) === '23505') throw new AdminContentError(409, 'A skill with this name already exists');
    throw err;
  }
};

// ---------------------------------------------------------------------------
// Questions
// ---------------------------------------------------------------------------

export interface AdminQuestion {
  id: number;
  conceptId: number | null;
  conceptName: string | null;
  difficulty: number;
  prompt: string;
  isActive: boolean;
  timesAnswered: number;
  options: { id: number; text: string; isCorrect: boolean }[];
}

const skillExists = async (skillId: number): Promise<void> => {
  const found = await query('SELECT 1 FROM skills WHERE id = $1', [skillId]);
  if (found.rowCount === 0) throw new AdminContentError(404, 'Skill not found');
};

/** All questions of a skill (active and hidden) with their options and the right answer */
export const listQuestions = async (skillId: number): Promise<AdminQuestion[]> => {
  await skillExists(skillId);
  const rows = await query<{
    id: number;
    concept_id: number | null;
    concept_name: string | null;
    difficulty: number;
    prompt: string;
    is_active: boolean;
    times_answered: number;
    option_id: number;
    option_text: string;
    is_correct: boolean;
  }>(
    `SELECT q.id, q.concept_id, c.name AS concept_name, q.difficulty, q.prompt, q.is_active,
            (SELECT COUNT(*) FROM assessment_answers a WHERE a.question_id = q.id)::int AS times_answered,
            o.id AS option_id, o.option_text, o.is_correct
     FROM questions q
     LEFT JOIN concepts c ON c.id = q.concept_id
     JOIN question_options o ON o.question_id = q.id
     WHERE q.skill_id = $1
     ORDER BY q.id, o.id`,
    [skillId]
  );

  const byId = new Map<number, AdminQuestion>();
  for (const row of rows.rows) {
    let question = byId.get(row.id);
    if (!question) {
      question = {
        id: row.id,
        conceptId: row.concept_id,
        conceptName: row.concept_name,
        difficulty: row.difficulty,
        prompt: row.prompt,
        isActive: row.is_active,
        timesAnswered: row.times_answered,
        options: [],
      };
      byId.set(row.id, question);
    }
    question.options.push({ id: row.option_id, text: row.option_text, isCorrect: row.is_correct });
  }
  return [...byId.values()];
};

/** The concept must belong to the same skill as the question */
const checkConcept = async (run: typeof query, skillId: number, conceptId: number): Promise<void> => {
  const concept = await run('SELECT 1 FROM concepts WHERE id = $1 AND skill_id = $2', [conceptId, skillId]);
  if (concept.rowCount === 0) throw new AdminContentError(400, 'conceptId does not belong to this skill');
};

/** Adds a question with its 4 options */
export const createQuestion = async (skillId: number, input: QuestionInput): Promise<{ id: number }> => {
  await skillExists(skillId);
  try {
    return await inTransaction(async (run) => {
      await checkConcept(run, skillId, input.conceptId);
      const question = await run<{ id: number }>(
        `INSERT INTO questions (skill_id, concept_id, difficulty, prompt)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [skillId, input.conceptId, input.difficulty, input.prompt]
      );
      for (const option of input.options) {
        await run('INSERT INTO question_options (question_id, option_text, is_correct) VALUES ($1, $2, $3)', [
          question.rows[0].id,
          option.text,
          option.isCorrect,
        ]);
      }
      return { id: question.rows[0].id };
    });
  } catch (err) {
    if (pgCode(err) === '23505') throw new AdminContentError(409, 'This skill already has a question with the same text');
    throw err;
  }
};

/**
 * Edits a question. The 4 option rows are updated in place (not replaced), because the answers of
 * users point to them.
 */
export const updateQuestion = async (questionId: number, input: QuestionInput): Promise<void> => {
  try {
    await inTransaction(async (run) => {
      const found = await run<{ skill_id: number }>('SELECT skill_id FROM questions WHERE id = $1', [questionId]);
      if (found.rowCount === 0) throw new AdminContentError(404, 'Question not found');
      await checkConcept(run, found.rows[0].skill_id, input.conceptId);

      const options = await run<{ id: number }>(
        'SELECT id FROM question_options WHERE question_id = $1 ORDER BY id',
        [questionId]
      );
      if (options.rowCount !== OPTIONS_PER_QUESTION) {
        throw new AdminContentError(409, 'This question has an unexpected number of options and cannot be edited');
      }

      await run('UPDATE questions SET concept_id = $1, difficulty = $2, prompt = $3 WHERE id = $4', [
        input.conceptId,
        input.difficulty,
        input.prompt,
        questionId,
      ]);
      for (let index = 0; index < OPTIONS_PER_QUESTION; index += 1) {
        await run('UPDATE question_options SET option_text = $1, is_correct = $2 WHERE id = $3', [
          input.options[index].text,
          input.options[index].isCorrect,
          options.rows[index].id,
        ]);
      }
    });
  } catch (err) {
    if (pgCode(err) === '23505') throw new AdminContentError(409, 'This skill already has a question with the same text');
    throw err;
  }
};

/** Shows or hides a question. A skill must keep enough active questions to be tested. */
export const setQuestionActive = async (questionId: number, isActive: boolean): Promise<void> => {
  const found = await query<{ skill_id: number; is_active: boolean }>(
    'SELECT skill_id, is_active FROM questions WHERE id = $1',
    [questionId]
  );
  if (found.rowCount === 0) throw new AdminContentError(404, 'Question not found');
  if (found.rows[0].is_active === isActive) return; // Nothing to change

  if (!isActive) {
    const others = await query<{ total: number }>(
      'SELECT COUNT(*)::int AS total FROM questions WHERE skill_id = $1 AND is_active AND id <> $2',
      [found.rows[0].skill_id, questionId]
    );
    if (others.rows[0].total < MIN_ACTIVE_QUESTIONS) {
      throw new AdminContentError(400, `A skill needs at least ${MIN_ACTIVE_QUESTIONS} active questions`);
    }
  }
  await query('UPDATE questions SET is_active = $1 WHERE id = $2', [isActive, questionId]);
};

// ---------------------------------------------------------------------------
// Skills of a goal
// ---------------------------------------------------------------------------

export interface GoalSkillRow {
  skillId: number;
  name: string;
  category: string | null;
  requiredMastery: number;
  importance: number;
  estimatedHours: number;
  activeQuestions: number;
  prerequisiteIds: number[]; // Prerequisites that are also part of this goal
}

export interface AvailableSkillRow {
  skillId: number;
  name: string;
  category: string | null;
  activeQuestions: number;
  canAdd: boolean; // False when the skill has too few active questions to be tested
}

export interface GoalSkillsView {
  goal: { id: number; name: string };
  skills: GoalSkillRow[];
  available: AvailableSkillRow[];
}

const goalExists = async (goalId: number): Promise<{ id: number; name: string }> => {
  const goal = await query<{ id: number; name: string }>('SELECT id, name FROM goals WHERE id = $1', [goalId]);
  if (goal.rowCount === 0) throw new AdminContentError(404, 'Goal not found');
  return goal.rows[0];
};

/** The skills of a goal, and the skills that can still be added to it */
export const getGoalSkills = async (goalId: number): Promise<GoalSkillsView> => {
  const goal = await goalExists(goalId);

  const inGoal = await query<{
    skill_id: number;
    name: string;
    category: string | null;
    required_proficiency: string | number;
    importance: string | number;
    estimated_hours: number;
    active_questions: number;
  }>(
    `SELECT gs.skill_id, s.name, s.category, gs.required_proficiency, gs.importance, gs.estimated_hours,
            (SELECT COUNT(*) FROM questions q WHERE q.skill_id = s.id AND q.is_active)::int AS active_questions
     FROM goal_skills gs
     JOIN skills s ON s.id = gs.skill_id
     WHERE gs.goal_id = $1
     ORDER BY s.name`,
    [goalId]
  );

  const edges = await query<{ skill_id: number; prerequisite_skill_id: number }>(
    `SELECT d.skill_id, d.prerequisite_skill_id
     FROM skill_dependencies d
     JOIN goal_skills a ON a.goal_id = $1 AND a.skill_id = d.skill_id
     JOIN goal_skills b ON b.goal_id = $1 AND b.skill_id = d.prerequisite_skill_id`,
    [goalId]
  );

  const available = await query<{
    id: number;
    name: string;
    category: string | null;
    active_questions: number;
  }>(
    `SELECT s.id, s.name, s.category,
            (SELECT COUNT(*) FROM questions q WHERE q.skill_id = s.id AND q.is_active)::int AS active_questions
     FROM skills s
     WHERE NOT EXISTS (SELECT 1 FROM goal_skills gs WHERE gs.goal_id = $1 AND gs.skill_id = s.id)
     ORDER BY s.name`,
    [goalId]
  );

  return {
    goal,
    skills: inGoal.rows.map((row) => ({
      skillId: row.skill_id,
      name: row.name,
      category: row.category,
      requiredMastery: Number(row.required_proficiency),
      importance: Number(row.importance),
      estimatedHours: row.estimated_hours,
      activeQuestions: row.active_questions,
      prerequisiteIds: edges.rows.filter((edge) => edge.skill_id === row.skill_id).map((edge) => edge.prerequisite_skill_id),
    })),
    available: available.rows.map((row) => ({
      skillId: row.id,
      name: row.name,
      category: row.category,
      activeQuestions: row.active_questions,
      canAdd: row.active_questions >= MIN_ACTIVE_QUESTIONS,
    })),
  };
};

/** Adds a skill to a goal */
export const addSkillToGoal = async (goalId: number, skillId: number, input: GoalSkillInput): Promise<void> => {
  await goalExists(goalId);
  await skillExists(skillId);

  const active = await query<{ total: number }>(
    'SELECT COUNT(*)::int AS total FROM questions WHERE skill_id = $1 AND is_active',
    [skillId]
  );
  if (active.rows[0].total < MIN_ACTIVE_QUESTIONS) {
    throw new AdminContentError(
      400,
      `The skill needs at least ${MIN_ACTIVE_QUESTIONS} active questions before it can be added to a goal`
    );
  }

  try {
    await query(
      `INSERT INTO goal_skills (goal_id, skill_id, required_proficiency, importance, estimated_hours)
       VALUES ($1, $2, $3, $4, $5)`,
      [goalId, skillId, input.requiredMastery, input.importance, input.estimatedHours]
    );
  } catch (err) {
    if (pgCode(err) === '23505') throw new AdminContentError(409, 'The skill is already part of this goal');
    throw err;
  }
};

/** Changes the mastery threshold, importance and hours of a skill inside one goal */
export const updateGoalSkill = async (goalId: number, skillId: number, input: GoalSkillInput): Promise<void> => {
  const result = await query(
    `UPDATE goal_skills
     SET required_proficiency = $1, importance = $2, estimated_hours = $3
     WHERE goal_id = $4 AND skill_id = $5
     RETURNING skill_id`,
    [input.requiredMastery, input.importance, input.estimatedHours, goalId, skillId]
  );
  if (result.rows.length === 0) throw new AdminContentError(404, 'This skill is not part of the goal');
};

/**
 * Removes a skill from a goal. The skill itself and the progress of users stay.
 * Skills that needed it lose that prerequisite inside this goal (the response lists them).
 */
export const removeSkillFromGoal = async (goalId: number, skillId: number): Promise<{ affectedSkills: string[] }> => {
  return inTransaction(async (run) => {
    const count = await run<{ total: number }>('SELECT COUNT(*)::int AS total FROM goal_skills WHERE goal_id = $1', [goalId]);
    const member = await run('SELECT 1 FROM goal_skills WHERE goal_id = $1 AND skill_id = $2', [goalId, skillId]);
    if (member.rowCount === 0) throw new AdminContentError(404, 'This skill is not part of the goal');
    if (count.rows[0].total <= 1) throw new AdminContentError(400, 'A goal needs at least one skill');

    const dependents = await run<{ name: string }>(
      `SELECT s.name
       FROM skill_dependencies d
       JOIN goal_skills gs ON gs.goal_id = $1 AND gs.skill_id = d.skill_id
       JOIN skills s ON s.id = d.skill_id
       WHERE d.prerequisite_skill_id = $2
       ORDER BY s.name`,
      [goalId, skillId]
    );

    await run('DELETE FROM goal_skills WHERE goal_id = $1 AND skill_id = $2', [goalId, skillId]);
    return { affectedSkills: dependents.rows.map((row) => row.name) };
  });
};

// ---------------------------------------------------------------------------
// Prerequisites of a skill inside a goal
// ---------------------------------------------------------------------------

const MAX_PREREQUISITES = 20;

export interface PrerequisiteInput {
  prerequisiteIds: number[];
}

export const parsePrerequisiteInput = (body: Record<string, unknown> | undefined): PrerequisiteInput => {
  const raw = body?.prerequisiteIds;
  if (!Array.isArray(raw)) throw new AdminContentError(400, 'prerequisiteIds must be a list of skill ids');
  if (raw.length > MAX_PREREQUISITES) {
    throw new AdminContentError(400, `A skill can have at most ${MAX_PREREQUISITES} prerequisites`);
  }
  const prerequisiteIds = raw.map((value, index) => cleanNumber(value, `prerequisiteIds[${index}]`, 1, 2147483647, true));
  if (new Set(prerequisiteIds).size !== prerequisiteIds.length) {
    throw new AdminContentError(400, 'prerequisiteIds must not repeat a skill');
  }
  return { prerequisiteIds };
};

export interface PrerequisiteChange {
  added: string[]; // Names of the prerequisites that were added
  removed: string[]; // Names of the prerequisites that were removed
  alsoAffectedGoals: string[]; // Other goals that contain both skills of a changed link
}

/** True when `target` can be reached from `start` by following prerequisites */
const dependsOn = (prerequisitesOf: Map<number, Set<number>>, start: number, target: number): boolean => {
  const seen = new Set<number>();
  const stack = [start];
  while (stack.length > 0) {
    const current = stack.pop() as number;
    if (current === target) return true;
    if (seen.has(current)) continue;
    seen.add(current);
    for (const next of prerequisitesOf.get(current) ?? []) stack.push(next);
  }
  return false;
};

/**
 * Replaces the prerequisites of one skill with the given list. Only skills of the same goal can be chosen.
 * A prerequisite of the skill that is NOT part of this goal is left untouched.
 * The link is shared: every other goal that contains both skills sees the same change
 * (the answer lists those goals). A change that would create a cycle is refused.
 */
export const setSkillPrerequisites = async (
  goalId: number,
  skillId: number,
  input: PrerequisiteInput
): Promise<PrerequisiteChange> => {
  return inTransaction(async (run) => {
    // Two admins editing at the same time must not be able to create a cycle together
    await run('LOCK TABLE skill_dependencies IN SHARE ROW EXCLUSIVE MODE');

    const members = await run<{ skill_id: number; name: string }>(
      `SELECT gs.skill_id, s.name FROM goal_skills gs JOIN skills s ON s.id = gs.skill_id WHERE gs.goal_id = $1`,
      [goalId]
    );
    const names = new Map(members.rows.map((row) => [row.skill_id, row.name]));
    if (!names.has(skillId)) throw new AdminContentError(404, 'This skill is not part of the goal');

    if (input.prerequisiteIds.includes(skillId)) {
      throw new AdminContentError(400, 'A skill cannot be its own prerequisite');
    }
    if (input.prerequisiteIds.some((id) => !names.has(id))) {
      throw new AdminContentError(400, 'Prerequisites must be skills of this goal');
    }

    const wanted = new Set(input.prerequisiteIds);
    const current = await run<{ prerequisite_skill_id: number }>(
      `SELECT d.prerequisite_skill_id
       FROM skill_dependencies d
       JOIN goal_skills gs ON gs.goal_id = $1 AND gs.skill_id = d.prerequisite_skill_id
       WHERE d.skill_id = $2`,
      [goalId, skillId]
    );
    const existing = new Set(current.rows.map((row) => row.prerequisite_skill_id));
    const toAdd = [...wanted].filter((id) => !existing.has(id));
    const toRemove = [...existing].filter((id) => !wanted.has(id));

    // The whole graph (all goals share it), with the change applied, must stay free of cycles
    const edges = await run<{ skill_id: number; prerequisite_skill_id: number }>(
      'SELECT skill_id, prerequisite_skill_id FROM skill_dependencies'
    );
    const prerequisitesOf = new Map<number, Set<number>>();
    for (const edge of edges.rows) {
      if (!prerequisitesOf.has(edge.skill_id)) prerequisitesOf.set(edge.skill_id, new Set());
      prerequisitesOf.get(edge.skill_id)!.add(edge.prerequisite_skill_id);
    }
    for (const id of toRemove) prerequisitesOf.get(skillId)?.delete(id);
    for (const id of toAdd) {
      if (dependsOn(prerequisitesOf, id, skillId)) {
        throw new AdminContentError(
          400,
          `"${names.get(id)}" already depends on "${names.get(skillId)}", so it cannot be its prerequisite`
        );
      }
    }

    for (const id of toRemove) {
      await run('DELETE FROM skill_dependencies WHERE skill_id = $1 AND prerequisite_skill_id = $2', [skillId, id]);
    }
    for (const id of toAdd) {
      await run('INSERT INTO skill_dependencies (skill_id, prerequisite_skill_id) VALUES ($1, $2)', [skillId, id]);
    }

    // Other goals that contain both skills of a changed link see the change too
    const affected = new Set<string>();
    for (const id of [...toAdd, ...toRemove]) {
      const goals = await run<{ name: string }>(
        `SELECT g.name
         FROM goals g
         JOIN goal_skills a ON a.goal_id = g.id AND a.skill_id = $2
         JOIN goal_skills b ON b.goal_id = g.id AND b.skill_id = $3
         WHERE g.id <> $1
         ORDER BY g.name`,
        [goalId, skillId, id]
      );
      for (const goal of goals.rows) affected.add(goal.name);
    }

    const nameOf = (id: number): string => names.get(id) as string;
    return {
      added: toAdd.map(nameOf).sort(),
      removed: toRemove.map(nameOf).sort(),
      alsoAffectedGoals: [...affected].sort(),
    };
  });
};