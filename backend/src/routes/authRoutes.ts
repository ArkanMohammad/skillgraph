/**
 * Register, login, current user and logout routes
 */
import { Router, Request, Response, CookieOptions } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query } from '../config/db';
import { env } from '../config/env';
import { User } from '../models';
import { authenticateJWT, AUTH_COOKIE } from '../middleware/authMiddleware';

const router = Router();
const SALT_ROUNDS = 10; // bcrypt cost
const TOKEN_EXPIRES_IN = '24h'; // JWT lifetime
const COOKIE_MAX_AGE_MS = 24 * 60 * 60 * 1000; // Same 24 hours

/** Cookie settings: JavaScript cannot read it (httpOnly) */
const cookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: env.isProduction, // HTTPS only in production
};

/** Public user fields (no password_hash) */
type PublicUser = Omit<User, 'password_hash'>;

const toPublicUser = (user: User): PublicUser => {
  const { password_hash: _hidden, ...safeUser } = user;
  return safeUser;
};

/** POST /register — create account */
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body.password === 'string' ? req.body.password : '';

    if (!name || !email || !password) {
      res.status(400).json({ message: 'name, email, and password are required' });
      return;
    }

    // Reject duplicate emails
    const existing = await query<User>('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rowCount && existing.rowCount > 0) {
      res.status(409).json({ message: 'Email already registered' });
      return;
    }

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS); // Hash password

    const inserted = await query<User>(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, role, created_at, updated_at`,
      [name, email, password_hash]
    );

    const user = inserted.rows[0];
    res.status(201).json({
      message: 'Account created',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        created_at: user.created_at,
        updated_at: user.updated_at,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

/** POST /login — verify credentials, issue JWT and set the cookie */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body.password === 'string' ? req.body.password : '';

    if (!email || !password) {
      res.status(400).json({ message: 'email and password are required' });
      return;
    }

    const found = await query<User>('SELECT * FROM users WHERE email = $1', [email]);
    const user = found.rows[0];

    if (!user) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    const match = await bcrypt.compare(password, user.password_hash); // Check hash
    if (!match) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    // Sign JWT for 24 hours
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      env.jwtSecret,
      { expiresIn: TOKEN_EXPIRES_IN }
    );

    // The browser keeps the cookie and sends it automatically
    res.cookie(AUTH_COOKIE, token, { ...cookieOptions, maxAge: COOKIE_MAX_AGE_MS });

    res.status(200).json({
      message: 'Login successful',
      token, // Still returned so Bearer clients (Postman) keep working
      user: toPublicUser(user),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

/** GET /me — who is logged in? Used by the frontend after a page refresh */
router.get('/me', authenticateJWT, async (req: Request, res: Response): Promise<void> => {
  try {
    const found = await query<User>(
      'SELECT id, name, email, role, created_at, updated_at FROM users WHERE id = $1',
      [req.user?.id]
    );
    const user = found.rows[0];

    if (!user) {
      res.status(401).json({ message: 'User not found' });
      return;
    }

    res.status(200).json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

/** POST /logout — remove the cookie */
router.post('/logout', (_req: Request, res: Response): void => {
  res.clearCookie(AUTH_COOKIE, cookieOptions);
  res.status(200).json({ message: 'Logged out' });
});

export default router;