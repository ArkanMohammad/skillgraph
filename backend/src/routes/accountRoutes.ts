/**
 * Account routes: profile, change password and delete account (logged-in user only)
 */
import { Router, Request, Response, CookieOptions } from 'express';
import bcrypt from 'bcrypt';
import { query } from '../config/db';
import { env } from '../config/env';
import { authenticateJWT, AUTH_COOKIE } from '../middleware/authMiddleware';

const router = Router();
const SALT_ROUNDS = 10;
const MIN_PASSWORD_LENGTH = 6;
const MAX_NAME_LENGTH = 100; // Same size as users.name
const MAX_WEEKLY_HOURS = 80;
const MAX_EMAIL_LENGTH = 255; // Same size as users.email
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Simple check: something@something.something

// Same cookie settings as login, so clearCookie removes the right cookie
const cookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: env.isProduction,
};

// Every route below needs a logged-in user
router.use(authenticateJWT);

/** Loads the stored password hash of the current user (null if the user is gone) */
const getPasswordHash = async (userId: string): Promise<string | null> => {
  const found = await query<{ password_hash: string }>(
    'SELECT password_hash FROM users WHERE id = $1',
    [userId]
  );
  return found.rows[0]?.password_hash ?? null;
};

/** GET /profile: name, email and weekly learning hours of the current user */
router.get('/profile', async (req: Request, res: Response): Promise<void> => {
  try {
    const found = await query<{ name: string; email: string; weekly_hours: number }>(
      'SELECT name, email, weekly_hours FROM users WHERE id = $1',
      [req.user!.id]
    );
    const row = found.rows[0];
    if (!row) {
      res.status(401).json({ message: 'User not found' });
      return;
    }
    res.status(200).json({ name: row.name, email: row.email, weeklyHours: row.weekly_hours });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

/** PUT /profile: change the name, the email and the weekly learning hours */
router.put('/profile', async (req: Request, res: Response): Promise<void> => {
  try {
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const weeklyHours = Number(req.body.weeklyHours);

    if (name.length < 1 || name.length > MAX_NAME_LENGTH) {
      res.status(400).json({ message: `Name must be 1 to ${MAX_NAME_LENGTH} characters` });
      return;
    }
    if (!EMAIL_PATTERN.test(email) || email.length > MAX_EMAIL_LENGTH) {
      res.status(400).json({ message: 'Please enter a valid email address' });
      return;
    }
    if (!Number.isInteger(weeklyHours) || weeklyHours < 1 || weeklyHours > MAX_WEEKLY_HOURS) {
      res.status(400).json({ message: `Weekly hours must be a whole number from 1 to ${MAX_WEEKLY_HOURS}` });
      return;
    }

    // The new email must not belong to another account
    const taken = await query('SELECT id FROM users WHERE email = $1 AND id <> $2', [
      email,
      req.user!.id,
    ]);
    if (taken.rowCount && taken.rowCount > 0) {
      res.status(409).json({ message: 'This email is already used by another account' });
      return;
    }

    const updated = await query<{ name: string; email: string; weekly_hours: number }>(
      `UPDATE users SET name = $1, email = $2, weekly_hours = $3, updated_at = NOW()
       WHERE id = $4
       RETURNING name, email, weekly_hours`,
      [name, email, weeklyHours, req.user!.id]
    );
    const row = updated.rows[0];
    if (!row) {
      res.status(401).json({ message: 'User not found' });
      return;
    }
    res.status(200).json({ name: row.name, email: row.email, weeklyHours: row.weekly_hours });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

/** PUT /password: change the password after checking the current one */
router.put('/password', async (req: Request, res: Response): Promise<void> => {
  try {
    const currentPassword =
      typeof req.body.currentPassword === 'string' ? req.body.currentPassword : '';
    const newPassword = typeof req.body.newPassword === 'string' ? req.body.newPassword : '';

    if (!currentPassword || !newPassword) {
      res.status(400).json({ message: 'Current and new password are required' });
      return;
    }
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      res.status(400).json({
        message: `New password must be at least ${MIN_PASSWORD_LENGTH} characters`,
      });
      return;
    }
    if (newPassword === currentPassword) {
      res.status(400).json({ message: 'New password must be different from the current one' });
      return;
    }

    const hash = await getPasswordHash(req.user!.id);
    if (!hash) {
      res.status(401).json({ message: 'User not found' });
      return;
    }

    const match = await bcrypt.compare(currentPassword, hash);
    if (!match) {
      res.status(400).json({ message: 'Current password is incorrect' });
      return;
    }

    const newHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [
      newHash,
      req.user!.id,
    ]);

    res.status(200).json({ message: 'Password changed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

/** DELETE /: delete the account (and all its data) after checking the password */
router.delete('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const password = typeof req.body.password === 'string' ? req.body.password : '';
    if (!password) {
      res.status(400).json({ message: 'Password is required' });
      return;
    }

    const hash = await getPasswordHash(req.user!.id);
    if (!hash) {
      res.status(401).json({ message: 'User not found' });
      return;
    }

    const match = await bcrypt.compare(password, hash);
    if (!match) {
      res.status(400).json({ message: 'Password is incorrect' });
      return;
    }

    // All tables that reference users use ON DELETE CASCADE,
    // so the goals, skills, assessments and answers of this user go with it
    await query('DELETE FROM users WHERE id = $1', [req.user!.id]);

    res.clearCookie(AUTH_COOKIE, cookieOptions);
    res.status(200).json({ message: 'Account deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;