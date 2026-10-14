/**
 * Tests for project shares and mentor recommendations (src/services/projectShareService.ts)
 * against PostgreSQL: the form rules, who may share with whom, the mentor desk, the signature,
 * and the cleanup rules. It builds its own fixture (every name starts with "d18test_") and removes
 * it at the end, so it does not touch the seeded content.
 * Run after `npm run migrate`, from the backend folder:
 *   npx ts-node --transpile-only src/tests/projectShares.test.ts
 */
import assert from 'node:assert';
import { pool, query } from '../config/db';
import { setUserRole } from '../services/mentorService';
import {
  MAX_SIGNATURE_LENGTH,
  ProjectShareError,
  cancelShare,
  checkSignature,
  createShare,
  declineRequest,
  generateCode,
  listMyShares,
  listRequests,
  parseRecommendationInput,
  parseShareInput,
  writeRecommendation,
} from '../services/projectShareService';

let passed = 0;
let failed = 0;

const test = async (name: string, fn: () => Promise<void> | void): Promise<void> => {
  try {
    await fn();
    passed += 1;
    console.log(`ok    ${name}`);
  } catch (err) {
    failed += 1;
    console.log(`FAIL  ${name}\n      ${(err as Error).message}`);
  }
};

/** The work must fail with a ProjectShareError that has exactly this HTTP status */
const rejectsWith = async (status: number, work: () => Promise<unknown> | unknown): Promise<void> => {
  try {
    await work();
  } catch (err) {
    assert.ok(err instanceof ProjectShareError, `expected ProjectShareError, got ${(err as Error).message}`);
    assert.strictEqual((err as ProjectShareError).status, status, `expected status ${status}: ${(err as Error).message}`);
    return;
  }
  assert.fail(`expected status ${status}, but nothing failed`);
};

/** The database must refuse the statement with exactly this SQLSTATE */
const refusedByDb = async (code: string, work: () => Promise<unknown>): Promise<void> => {
  try {
    await work();
  } catch (err) {
    assert.strictEqual((err as { code?: string }).code, code, `expected SQLSTATE ${code}: ${(err as Error).message}`);
    return;
  }
  assert.fail(`expected SQLSTATE ${code}, but nothing failed`);
};

/** A small fake PNG: the right first bytes and enough data to pass the size check */
const PNG_HEAD = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const fakePng = (extra = 200): string =>
  `data:image/png;base64,${Buffer.concat([PNG_HEAD, Buffer.alloc(extra, 7)]).toString('base64')}`;

const GOOD_TEXT =
  'Sara built a clean, well structured project and explained every decision clearly. I recommend her.';
const GOOD_DESCRIPTION = 'A small portfolio website built with React and TypeScript, with three pages.';

async function main(): Promise<void> {
  const stamp = Date.now();
  const createUser = async (label: string, role = 'USER'): Promise<string> =>
    (
      await query<{ id: string }>(
        `INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, 'x', $3) RETURNING id`,
        [`d18test_${label}`, `d18test_${label}_${stamp}@example.com`, role]
      )
    ).rows[0].id;
  const createGoal = async (label: string): Promise<number> =>
    (await query<{ id: number }>('INSERT INTO goals (name) VALUES ($1) RETURNING id', [`d18test_${label}_${stamp}`])).rows[0].id;
  const follow = async (userId: string, goalId: number): Promise<void> => {
    await query('INSERT INTO user_goals (user_id, goal_id, is_current) VALUES ($1, $2, TRUE)', [userId, goalId]);
  };
  const mentorOf = async (goalId: number, mentorId: string): Promise<void> => {
    await query('INSERT INTO goal_mentors (goal_id, mentor_id) VALUES ($1, $2)', [goalId, mentorId]);
  };
  const share = (mentorId: string, title = 'My portfolio'): { mentorId: string; title: string; description: string; projectUrl: string | null } => ({
    mentorId,
    title,
    description: GOOD_DESCRIPTION,
    projectUrl: 'https://github.com/example/portfolio',
  });
  const recommendation = { body: GOOD_TEXT, mentorTitle: 'Senior Frontend Engineer', signature: fakePng() };

  const goalA = await createGoal('goalA');
  const goalB = await createGoal('goalB');
  const mentorOne = await createUser('mentor_one', 'MENTOR');
  const mentorTwo = await createUser('mentor_two', 'MENTOR');
  const outsider = await createUser('outsider', 'USER');
  const learner = await createUser('learner');
  const learnerTwo = await createUser('learner_two');
  const noGoal = await createUser('no_goal');
  await mentorOf(goalA, mentorOne);
  await mentorOf(goalB, mentorTwo);
  await follow(learner, goalA);
  await follow(learnerTwo, goalA);

  try {
    console.log('--- Form rules (no database) ---');

    await test('parseShareInput cleans and accepts a good form', () => {
      const parsed = parseShareInput({
        mentorId: mentorOne,
        title: '  My portfolio  ',
        description: `  ${GOOD_DESCRIPTION}  `,
        projectUrl: '',
      });
      assert.strictEqual(parsed.title, 'My portfolio');
      assert.strictEqual(parsed.description, GOOD_DESCRIPTION);
      assert.strictEqual(parsed.projectUrl, null);
    });

    await test('parseShareInput refuses a missing mentor, short texts and a bad link (400)', async () => {
      await rejectsWith(400, () => parseShareInput({ ...share(mentorOne), mentorId: '' }));
      await rejectsWith(400, () => parseShareInput({ ...share(mentorOne), title: 'ab' }));
      await rejectsWith(400, () => parseShareInput({ ...share(mentorOne), title: 'x'.repeat(121) }));
      await rejectsWith(400, () => parseShareInput({ ...share(mentorOne), description: 'too short' }));
      await rejectsWith(400, () => parseShareInput({ ...share(mentorOne), projectUrl: 'javascript:alert(1)' }));
      await rejectsWith(400, () => parseShareInput({ ...share(mentorOne), projectUrl: 'not a link' }));
      await rejectsWith(400, () => parseShareInput(null));
    });

    await test('checkSignature accepts a PNG and refuses other data (400)', async () => {
      checkSignature(fakePng());
      await rejectsWith(400, () => checkSignature(''));
      await rejectsWith(400, () => checkSignature('data:image/jpeg;base64,AAAA'));
      await rejectsWith(400, () => checkSignature('data:image/png;base64,###not-base64###'));
      // Valid base64 but not a PNG (wrong first bytes)
      await rejectsWith(400, () => checkSignature(`data:image/png;base64,${Buffer.alloc(300, 1).toString('base64')}`));
      // A PNG that is far too small to be a drawing
      await rejectsWith(400, () => checkSignature(`data:image/png;base64,${PNG_HEAD.toString('base64')}`));
    });

    await test('checkSignature refuses a signature that is too big (400)', async () => {
      const huge = `data:image/png;base64,${'A'.repeat(MAX_SIGNATURE_LENGTH)}`;
      await rejectsWith(400, () => checkSignature(huge));
    });

    await test('parseRecommendationInput checks the text, the title and the signature (400)', async () => {
      assert.strictEqual(parseRecommendationInput(recommendation).mentorTitle, 'Senior Frontend Engineer');
      await rejectsWith(400, () => parseRecommendationInput({ ...recommendation, body: 'Too short.' }));
      await rejectsWith(400, () => parseRecommendationInput({ ...recommendation, body: 'x'.repeat(2001) }));
      await rejectsWith(400, () => parseRecommendationInput({ ...recommendation, mentorTitle: '' }));
      await rejectsWith(400, () => parseRecommendationInput({ ...recommendation, signature: '' }));
    });

    await test('generateCode makes readable, different codes', () => {
      const codes = new Set<string>();
      for (let i = 0; i < 1000; i += 1) {
        const code = generateCode();
        assert.match(code, /^SG-[A-HJKMNP-Z2-9]{4}-[A-HJKMNP-Z2-9]{4}-[A-HJKMNP-Z2-9]{4}$/);
        codes.add(code);
      }
      assert.strictEqual(codes.size, 1000);
    });

    console.log('\n--- Database ---');

    await test('project_shares refuses a bad status, a short title and unknown users', async () => {
      await refusedByDb('23514', () =>
        query(
          `INSERT INTO project_shares (learner_id, goal_id, title, description, status)
           VALUES ($1, $2, 'A title', $3, 'DONE')`,
          [learner, goalA, GOOD_DESCRIPTION]
        )
      );
      await refusedByDb('23514', () =>
        query(`INSERT INTO project_shares (learner_id, goal_id, title, description) VALUES ($1, $2, 'ab', $3)`, [
          learner,
          goalA,
          GOOD_DESCRIPTION,
        ])
      );
      await refusedByDb('23503', () =>
        query(`INSERT INTO project_shares (learner_id, goal_id, title, description) VALUES ($1, $2, 'A title', $3)`, [
          '00000000-0000-4000-8000-000000000000',
          goalA,
          GOOD_DESCRIPTION,
        ])
      );
    });

    await test('recommendations needs a PNG signature, a long enough text and one per share', async () => {
      const id = (
        await query<{ id: number }>(
          `INSERT INTO project_shares (learner_id, mentor_id, goal_id, title, description)
           VALUES ($1, $2, $3, 'A title', $4) RETURNING id`,
          [learner, mentorOne, goalA, GOOD_DESCRIPTION]
        )
      ).rows[0].id;
      const insert = (signature: string, body: string, code: string): Promise<unknown> =>
        query(
          `INSERT INTO recommendations (share_id, mentor_name, mentor_title, body, signature, code)
           VALUES ($1, 'Mentor', 'Engineer', $2, $3, $4)`,
          [id, body, signature, code]
        );
      await refusedByDb('23514', () => insert('hello', GOOD_TEXT, 'SG-TEST-0001'));
      await refusedByDb('23514', () => insert(fakePng(), 'short', 'SG-TEST-0002'));
      await insert(fakePng(), GOOD_TEXT, 'SG-TEST-0003');
      await refusedByDb('23505', () => insert(fakePng(), GOOD_TEXT, 'SG-TEST-0004')); // second one for the same share
      await query('DELETE FROM project_shares WHERE id = $1', [id]);
    });

    await test('a verification code is unique', async () => {
      const ids: number[] = [];
      for (const title of ['First project', 'Second project']) {
        ids.push(
          (
            await query<{ id: number }>(
              `INSERT INTO project_shares (learner_id, mentor_id, goal_id, title, description)
               VALUES ($1, $2, $3, $4, $5) RETURNING id`,
              [learner, mentorOne, goalA, title, GOOD_DESCRIPTION]
            )
          ).rows[0].id
        );
      }
      const insert = (shareId: number): Promise<unknown> =>
        query(
          `INSERT INTO recommendations (share_id, mentor_name, mentor_title, body, signature, code)
           VALUES ($1, 'Mentor', 'Engineer', $2, $3, 'SG-SAME-CODE')`,
          [shareId, GOOD_TEXT, fakePng()]
        );
      await insert(ids[0]);
      await refusedByDb('23505', () => insert(ids[1]));
      await query('DELETE FROM project_shares WHERE id IN ($1, $2)', ids);
    });

    console.log('\n--- Sharing a project ---');

    let firstShare = 0;
    await test('a learner shares a project with a mentor of the goal they follow', async () => {
      firstShare = await createShare(learner, share(mentorOne, 'Portfolio website'));
      const mine = await listMyShares(learner);
      assert.strictEqual(mine.length, 1);
      assert.strictEqual(mine[0].status, 'PENDING');
      assert.strictEqual(mine[0].mentorName, 'd18test_mentor_one');
      assert.strictEqual(mine[0].recommendation, null);
    });

    await test('sharing needs a goal, a mentor of that goal and a real mentor (400)', async () => {
      await rejectsWith(400, () => createShare(noGoal, share(mentorOne)));
      await rejectsWith(400, () => createShare(learner, share(mentorTwo))); // mentor of another goal
      await rejectsWith(400, () => createShare(learner, share(outsider))); // not a mentor at all
      await rejectsWith(400, () => createShare(learner, share(learnerTwo))); // another learner
    });

    await test('a learner can have at most 5 projects waiting', async () => {
      for (let i = 2; i <= 5; i += 1) await createShare(learner, share(mentorOne, `Project number ${i}`));
      await rejectsWith(400, () => createShare(learner, share(mentorOne, 'One too many')));
      assert.strictEqual((await listMyShares(learner)).length, 5);
    });

    await test('a learner only sees their own projects', async () => {
      assert.strictEqual((await listMyShares(learnerTwo)).length, 0);
    });

    await test('a waiting project can be taken back, not by someone else (404)', async () => {
      await rejectsWith(404, () => cancelShare(learnerTwo, firstShare));
      await cancelShare(learner, firstShare);
      assert.strictEqual((await listMyShares(learner)).length, 4);
      await rejectsWith(404, () => cancelShare(learner, firstShare));
    });

    console.log('\n--- The desk of a mentor ---');

    await test('a mentor sees only the projects shared with them, with the learner name', async () => {
      const requests = await listRequests(mentorOne);
      assert.strictEqual(requests.length, 4);
      assert.ok(requests.every((item) => item.learnerName === 'd18test_learner' && item.status === 'PENDING'));
      assert.deepStrictEqual(await listRequests(mentorTwo), []);
    });

    await test('only a user with the role MENTOR has a desk (403)', async () => {
      await rejectsWith(403, () => listRequests(learner));
      await rejectsWith(403, () => writeRecommendation(learner, 1, recommendation));
      await rejectsWith(403, () => declineRequest(outsider, 1, {}));
    });

    const target = (await listRequests(mentorOne))[0].id;

    await test('a bad recommendation changes nothing (400)', async () => {
      await rejectsWith(400, () => parseRecommendationInput({ ...recommendation, signature: 'nope' }));
      const status = await query<{ status: string }>('SELECT status FROM project_shares WHERE id = $1', [target]);
      assert.strictEqual(status.rows[0].status, 'PENDING');
    });

    await test('another mentor cannot answer a project that was not shared with them (404)', async () => {
      await rejectsWith(404, () => writeRecommendation(mentorTwo, target, recommendation));
      await rejectsWith(404, () => declineRequest(mentorTwo, target, {}));
      await rejectsWith(404, () => writeRecommendation(mentorOne, 999999999, recommendation));
    });

    let code = '';
    await test('the mentor writes a signed recommendation and the learner receives it', async () => {
      code = await writeRecommendation(mentorOne, target, recommendation);
      assert.match(code, /^SG-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/);

      const mine = (await listMyShares(learner)).find((item) => item.id === target);
      assert.ok(mine);
      assert.strictEqual(mine.status, 'RECOMMENDED');
      assert.ok(mine.decidedAt);
      assert.ok(mine.recommendation);
      assert.strictEqual(mine.recommendation.code, code);
      assert.strictEqual(mine.recommendation.mentorName, 'd18test_mentor_one');
      assert.strictEqual(mine.recommendation.mentorTitle, 'Senior Frontend Engineer');
      assert.strictEqual(mine.recommendation.body, GOOD_TEXT);
      assert.strictEqual(mine.recommendation.signature, recommendation.signature);
    });

    await test('the mentor desk shows the code and a request cannot be answered twice (409)', async () => {
      const done = (await listRequests(mentorOne)).find((item) => item.id === target);
      assert.strictEqual(done?.status, 'RECOMMENDED');
      assert.strictEqual(done?.code, code);
      await rejectsWith(409, () => writeRecommendation(mentorOne, target, recommendation));
      await rejectsWith(409, () => declineRequest(mentorOne, target, {}));
    });

    await test('a project with a recommendation cannot be removed by the learner (400)', async () => {
      await rejectsWith(400, () => cancelShare(learner, target));
    });

    await test('a mentor can decline with a note, and the learner can then remove it', async () => {
      const other = (await listRequests(mentorOne)).find((item) => item.status === 'PENDING')!.id;
      await declineRequest(mentorOne, other, { note: '  Please add tests first.  ' });
      const mine = (await listMyShares(learner)).find((item) => item.id === other);
      assert.strictEqual(mine?.status, 'DECLINED');
      assert.strictEqual(mine?.declineNote, 'Please add tests first.');
      await cancelShare(learner, other);
      assert.strictEqual((await listMyShares(learner)).some((item) => item.id === other), false);
    });

    await test('a decline note is optional and limited to 300 characters', async () => {
      await rejectsWith(400, async () => declineRequest(mentorOne, target, { note: 'x'.repeat(301) }));
      const another = (await listRequests(mentorOne)).find((item) => item.status === 'PENDING')!.id;
      await declineRequest(mentorOne, another, {});
      const row = await query<{ decline_note: string | null }>('SELECT decline_note FROM project_shares WHERE id = $1', [another]);
      assert.strictEqual(row.rows[0].decline_note, null);
    });

    await test('the waiting projects are listed before the answered ones', async () => {
      const requests = await listRequests(mentorOne);
      const firstAnswered = requests.findIndex((item) => item.status !== 'PENDING');
      const lastWaiting = requests.map((item) => item.status).lastIndexOf('PENDING');
      assert.ok(firstAnswered === -1 || lastWaiting < firstAnswered);
    });

    console.log('\n--- Cleanup rules ---');

    await test('a mentor who stops being a mentor releases the waiting projects', async () => {
      const spare = await createUser('mentor_spare', 'MENTOR');
      await mentorOf(goalA, spare);
      const id = await createShare(learnerTwo, share(spare, 'Waiting project'));
      await setUserRole(spare, 'USER');
      const mine = (await listMyShares(learnerTwo)).find((item) => item.id === id);
      assert.strictEqual(mine?.status, 'PENDING');
      assert.strictEqual(mine?.mentorName, null);
      await rejectsWith(403, () => listRequests(spare));
      await cancelShare(learnerTwo, id);
    });

    await test('deleting a mentor account keeps the recommendation and its signed name', async () => {
      const temp = await createUser('mentor_temp', 'MENTOR');
      await mentorOf(goalA, temp);
      const id = await createShare(learnerTwo, share(temp, 'Signed project'));
      await writeRecommendation(temp, id, recommendation);
      await query('DELETE FROM users WHERE id = $1', [temp]);
      const mine = (await listMyShares(learnerTwo)).find((item) => item.id === id);
      assert.strictEqual(mine?.status, 'RECOMMENDED');
      assert.strictEqual(mine?.mentorName, 'd18test_mentor_temp');
      assert.strictEqual(mine?.recommendation?.mentorName, 'd18test_mentor_temp');
      const row = await query<{ mentor_id: string | null }>('SELECT mentor_id FROM project_shares WHERE id = $1', [id]);
      assert.strictEqual(row.rows[0].mentor_id, null);
    });

    await test('deleting a learner removes their projects and recommendations', async () => {
      const count = async (): Promise<number> =>
        Number(
          (
            await query<{ count: string }>(
              `SELECT COUNT(*) AS count FROM recommendations r JOIN project_shares s ON s.id = r.share_id WHERE s.learner_id = $1`,
              [learnerTwo]
            )
          ).rows[0].count
        );
      assert.strictEqual(await count(), 1);
      await query('DELETE FROM users WHERE id = $1', [learnerTwo]);
      assert.strictEqual((await query('SELECT 1 FROM project_shares WHERE learner_id = $1', [learnerTwo])).rowCount, 0);
      assert.strictEqual(
        (await query(`SELECT 1 FROM recommendations WHERE mentor_name = 'd18test_mentor_temp'`)).rowCount,
        0
      );
    });
  } finally {
    await query(`DELETE FROM users WHERE email LIKE $1`, [`d18test_%_${stamp}@example.com`]);
    await query(`DELETE FROM goals WHERE name LIKE $1`, [`d18test_%_${stamp}`]);
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  await pool.end();
  if (failed > 0) process.exit(1);
}

main().catch(async (err) => {
  console.error(err);
  await pool.end().catch(() => undefined);
  process.exit(1);
});