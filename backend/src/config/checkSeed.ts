/**
 * Seed consistency check: reads the DATABASE (not the seed files) and reports data problems
 * that would show up as wrong graphs or wrong recommendations.
 *   npm run check:seed
 *
 * FAIL = the app will misbehave, WARN = worth a look. Exits with 1 when something FAILS.
 */
import { pool, query } from './db';
import { DEPENDENCIES, GOAL_SKILLS, SKILLS } from '../seed/catalog';

type Level = 'PASS' | 'WARN' | 'FAIL';
let failures = 0;
let warnings = 0;

const report = (level: Level, name: string, details: string[] = []): void => {
  if (level === 'FAIL') failures += 1;
  if (level === 'WARN') warnings += 1;
  console.log(`${level.padEnd(5)} ${name}`);
  for (const line of details.slice(0, 15)) console.log(`        - ${line}`);
  if (details.length > 15) console.log(`        ... and ${details.length - 15} more`);
};

/** PASS when there is nothing to report, otherwise the given level with the problems */
const expectNone = (level: Level, name: string, problems: string[]): void =>
  report(problems.length === 0 ? 'PASS' : level, name, problems);

const names = async (sql: string, params: unknown[] = []): Promise<string[]> =>
  (await query<{ line: string }>(sql, params)).rows.map((row) => row.line);

async function main(): Promise<void> {
  console.log('SkillGraph seed consistency check\n');

  // ---------- Goals and the catalog ----------
  const goalCount = Number((await query<{ total: string }>('SELECT COUNT(*) AS total FROM goals')).rows[0].total);
  report(goalCount === Object.keys(GOAL_SKILLS).length ? 'PASS' : 'FAIL', `goals in the database: ${goalCount}`);

  const skillCount = Number((await query<{ total: string }>('SELECT COUNT(*) AS total FROM skills')).rows[0].total);
  report(skillCount === SKILLS.length ? 'PASS' : 'FAIL', `skills match the catalog: ${skillCount} of ${SKILLS.length}`);

  const dependencyCount = Number(
    (await query<{ total: string }>('SELECT COUNT(*) AS total FROM skill_dependencies')).rows[0].total
  );
  report(
    dependencyCount === DEPENDENCIES.length ? 'PASS' : 'FAIL',
    `prerequisites match the catalog: ${dependencyCount} of ${DEPENDENCIES.length} (run the seed again if they differ)`
  );

  // Every goal must hold exactly the skills the catalog lists for it
  const stored = await query<{ name: string; total: string }>(
    `SELECT g.name, COUNT(gs.skill_id) AS total
     FROM goals g LEFT JOIN goal_skills gs ON gs.goal_id = g.id
     GROUP BY g.id, g.name ORDER BY g.name`
  );
  const storedTotals = new Map(stored.rows.map((row) => [row.name, Number(row.total)]));
  expectNone(
    'FAIL',
    'every goal has the skills the catalog lists',
    Object.entries(GOAL_SKILLS)
      .filter(([goal, list]) => storedTotals.get(goal) !== list.length)
      .map(([goal, list]) => `${goal}: ${storedTotals.get(goal) ?? 'missing'} in the database, ${list.length} in the catalog`)
  );

  // ---------- Graph shape ----------
  expectNone(
    'WARN',
    'every prerequisite of a goal skill is also part of that goal (if not, that edge is simply not drawn in this goal: fine when intended)',
    await names(
      `SELECT g.name || ': "' || s.name || '" needs "' || p.name || '" which is not in the goal' AS line
       FROM goal_skills gs
       JOIN goals g ON g.id = gs.goal_id
       JOIN skills s ON s.id = gs.skill_id
       JOIN skill_dependencies d ON d.skill_id = s.id
       JOIN skills p ON p.id = d.prerequisite_skill_id
       WHERE NOT EXISTS (
         SELECT 1 FROM goal_skills x WHERE x.goal_id = gs.goal_id AND x.skill_id = d.prerequisite_skill_id
       )
       ORDER BY g.name, s.name`
    )
  );

  expectNone(
    'FAIL',
    'every goal has a starting skill (a skill without prerequisites inside the goal)',
    await names(
      `SELECT g.name AS line
       FROM goals g
       WHERE NOT EXISTS (
         SELECT 1 FROM goal_skills gs
         WHERE gs.goal_id = g.id
           AND NOT EXISTS (
             SELECT 1 FROM skill_dependencies d
             JOIN goal_skills px ON px.goal_id = gs.goal_id AND px.skill_id = d.prerequisite_skill_id
             WHERE d.skill_id = gs.skill_id
           )
       )`
    )
  );

  // A cycle means a skill that can never become READY
  const cycles = await names(
    `WITH RECURSIVE walk(start_id, current_id, depth) AS (
       SELECT skill_id, prerequisite_skill_id, 1 FROM skill_dependencies
       UNION ALL
       SELECT w.start_id, d.prerequisite_skill_id, w.depth + 1
       FROM walk w JOIN skill_dependencies d ON d.skill_id = w.current_id
       WHERE w.depth < 60 AND w.current_id <> w.start_id
     )
     SELECT DISTINCT s.name AS line FROM walk w JOIN skills s ON s.id = w.start_id WHERE w.current_id = w.start_id`
  );
  expectNone('FAIL', 'no prerequisite cycles', cycles.map((name) => `"${name}" is its own ancestor`));

  expectNone(
    'WARN',
    'every skill belongs to at least one goal',
    await names(`SELECT name AS line FROM skills WHERE id NOT IN (SELECT skill_id FROM goal_skills) ORDER BY name`)
  );

  expectNone(
    'FAIL',
    'goal values are usable (required mastery 0.5 to 1, importance above 0, hours above 0)',
    await names(
      `SELECT g.name || ' / ' || s.name AS line
       FROM goal_skills gs JOIN goals g ON g.id = gs.goal_id JOIN skills s ON s.id = gs.skill_id
       WHERE gs.required_proficiency < 0.5 OR gs.importance <= 0 OR gs.estimated_hours <= 0`
    )
  );

  // ---------- Assessment content ----------
  expectNone(
    'FAIL',
    'every skill has 6 questions: 2 easy, 2 medium, 2 hard',
    await names(
      `SELECT s.name || ': ' ||
              COUNT(q.id) FILTER (WHERE q.difficulty = 1) || '/' ||
              COUNT(q.id) FILTER (WHERE q.difficulty = 2) || '/' ||
              COUNT(q.id) FILTER (WHERE q.difficulty = 3) || ' (easy/medium/hard)' AS line
       FROM skills s LEFT JOIN questions q ON q.skill_id = s.id
       GROUP BY s.id, s.name
       HAVING COUNT(q.id) <> 6
           OR COUNT(q.id) FILTER (WHERE q.difficulty = 1) <> 2
           OR COUNT(q.id) FILTER (WHERE q.difficulty = 2) <> 2
           OR COUNT(q.id) FILTER (WHERE q.difficulty = 3) <> 2
       ORDER BY s.name`
    )
  );

  expectNone(
    'FAIL',
    'every question has 4 options and exactly one correct option',
    await names(
      `SELECT q.skill_id || ' / question ' || q.id || ': ' || COUNT(o.id) || ' options, ' ||
              COUNT(o.id) FILTER (WHERE o.is_correct) || ' correct' AS line
       FROM questions q LEFT JOIN question_options o ON o.question_id = q.id
       GROUP BY q.id, q.skill_id
       HAVING COUNT(o.id) <> 4 OR COUNT(o.id) FILTER (WHERE o.is_correct) <> 1`
    )
  );

  expectNone(
    'FAIL',
    'concept weights of every skill add up to 1',
    await names(
      `SELECT s.name || ': ' || SUM(c.weight) AS line
       FROM concepts c JOIN skills s ON s.id = c.skill_id
       GROUP BY s.id, s.name HAVING ABS(SUM(c.weight) - 1) > 0.001`
    )
  );

  expectNone(
    'WARN',
    'every question belongs to a concept, and every concept has a question',
    [
      ...(await names(`SELECT 'question ' || id || ' has no concept' AS line FROM questions WHERE concept_id IS NULL`)),
      ...(await names(
        `SELECT s.name || ' / ' || c.name || ' has no question' AS line
         FROM concepts c JOIN skills s ON s.id = c.skill_id
         WHERE NOT EXISTS (SELECT 1 FROM questions q WHERE q.concept_id = c.id)`
      )),
    ]
  );

  console.log(`\n${failures} failed, ${warnings} warnings`);
  await pool.end();
  if (failures > 0) process.exit(1);
}

main().catch(async (err) => {
  console.error(err);
  await pool.end().catch(() => undefined);
  process.exit(1);
});