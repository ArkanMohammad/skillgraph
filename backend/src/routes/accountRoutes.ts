/**
 * Account routes: change password and delete account (logged-in user only)
 */
import { Router, Request, Response, CookieOptions } from 'express';
import bcrypt from 'bcrypt';
import { query } from '../config/db';
import { env } from '../config/env';
import { authenticateJWT, AUTH_COOKIE } from '../middleware/authMiddleware';

const router = Router();
const SALT_ROUNDS = 10;
const MIN_PASSWORD_LENGTH = 6;

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