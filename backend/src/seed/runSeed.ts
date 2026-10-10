/**
 * Fills the database with skills, goals, prerequisites, concepts and questions.
 * يملأ قاعدة البيانات بالمهارات والأهداف والاعتماديات والمفاهيم والأسئلة.
 *
 * Run from the backend folder:  npx ts-node --transpile-only src/seed/runSeed.ts
 * It is safe to run many times (nothing is duplicated).
 * It uses plain SQL only (no plpgsql / DO blocks).
 */
import { pool } from '../config/db';
import { ensureAssessmentSchema } from '../config/ensureSchema';
import { seedGoals } from '../config/seedData';
import { DEPENDENCIES, GOAL_SKILLS, SKILLS } from './catalog';
import { allQuestions } from './allQuestions';
import { validateSeedData } from './validate';

/** Small fixed hash so the correct answer moves between A/B/C/D but never changes between runs */
const hashText = (text: string): number => {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

/** Places the correct option at a stable "random" position / يضع الإجابة الصحيحة بمكان ثابت */
const buildOptions = (
  prompt: string,
  correct: string,
  wrong: [string, string, string]
): { text: string; isCorrect: boolean }[] => {
  const options = wrong.map((text) => ({ text, isCorrect: false }));
  options.splice(hashText(prompt) % 4, 0, { text: correct, isCorrect: true });
  return options;
};

async function main(): Promise<void> {
  // 1) Validate the data first / تحقق من البيانات أولاً
  const problems = validateSeedData();
  if (problems.length > 0) {
    console.error('Seed data has problems, nothing was written:\n- ' + problems.join('\n- '));
    process.exit(1);
  }

  // 2) Make sure tables and the 7 goals exist / تأكد من وجود الجداول والأهداف
  await ensureAssessmentSchema();
  await seedGoals();

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 3) Skills / المهارات
    const skillIds = new Map<string, number>();
    for (const skill of SKILLS) {
      const result = await client.query<{ id: number }>(
        `INSERT INTO skills (name, description, category)
         VALUES ($1, $2, $3)
         ON CONFLICT (name) DO UPDATE
         SET description = EXCLUDED.description, category = EXCLUDED.category
         RETURNING id`,
        [skill.name, skill.description, skill.category]
      );
      skillIds.set(skill.name, result.rows[0].id);
    }

    // 4) Prerequisites / الاعتماديات
    for (const [skill, prerequisite] of DEPENDENCIES) {
      await client.query(
        `INSERT INTO skill_dependencies (skill_id, prerequisite_skill_id)
         VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [skillIds.get(skill), skillIds.get(prerequisite)]
      );
    }

    // 5) Goals and their skills / مهارات كل هدف
    const hoursBySkill = new Map(SKILLS.map((s) => [s.name, s.hours]));
    for (const [goalName, list] of Object.entries(GOAL_SKILLS)) {
      const goal = await client.query<{ id: number }>('SELECT id FROM goals WHERE name = $1', [goalName]);
      if (goal.rowCount === 0) throw new Error(`Goal "${goalName}" does not exist in the goals table`);
      for (const [skill, required, importance] of list) {
        await client.query(
          `INSERT INTO goal_skills (goal_id, skill_id, required_proficiency, importance, estimated_hours)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (goal_id, skill_id) DO UPDATE
           SET required_proficiency = EXCLUDED.required_proficiency,
               importance = EXCLUDED.importance,
               estimated_hours = EXCLUDED.estimated_hours`,
          [goal.rows[0].id, skillIds.get(skill), required, importance, hoursBySkill.get(skill)]
        );
      }
    }

    // 6) Concepts and questions / المفاهيم والأسئلة
    let questionCount = 0;
    for (const item of allQuestions) {
      const skillId = skillIds.get(item.skill);

      // Old questions (from before concepts existed) are replaced by the new ones
      await client.query('DELETE FROM questions WHERE skill_id = $1 AND concept_id IS NULL', [skillId]);

      const conceptIds: number[] = [];
      for (const [name, weight] of item.concepts) {
        const concept = await client.query<{ id: number }>(
          `INSERT INTO concepts (skill_id, name, weight)
           VALUES ($1, $2, $3)
           ON CONFLICT (skill_id, name) DO UPDATE SET weight = EXCLUDED.weight
           RETURNING id`,
          [skillId, name, weight]
        );
        conceptIds.push(concept.rows[0].id);
      }

      for (const [conceptIndex, difficulty, prompt, correct, wrong] of item.questions) {
        const question = await client.query<{ id: number }>(
          `INSERT INTO questions (skill_id, concept_id, difficulty, prompt)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (skill_id, prompt) DO UPDATE
           SET concept_id = EXCLUDED.concept_id, difficulty = EXCLUDED.difficulty
           RETURNING id`,
          [skillId, conceptIds[conceptIndex], difficulty, prompt]
        );
        const questionId = question.rows[0].id;
        const options = buildOptions(prompt, correct, wrong);

        // Update the options in place when they exist (answers may point to them)
        const existing = await client.query<{ id: number }>(
          'SELECT id FROM question_options WHERE question_id = $1 ORDER BY id',
          [questionId]
        );
        if (existing.rowCount === options.length) {
          for (let i = 0; i < options.length; i += 1) {
            await client.query(
              'UPDATE question_options SET option_text = $1, is_correct = $2 WHERE id = $3',
              [options[i].text, options[i].isCorrect, existing.rows[i].id]
            );
          }
        } else {
          await client.query('DELETE FROM question_options WHERE question_id = $1', [questionId]);
          for (const option of options) {
            await client.query(
              'INSERT INTO question_options (question_id, option_text, is_correct) VALUES ($1, $2, $3)',
              [questionId, option.text, option.isCorrect]
            );
          }
        }
        questionCount += 1;
      }
    }

    await client.query('COMMIT');
    console.log(
      `Seed done: ${SKILLS.length} skills, ${DEPENDENCIES.length} prerequisites, ` +
        `${Object.keys(GOAL_SKILLS).length} goals, ${questionCount} questions`
    );
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});