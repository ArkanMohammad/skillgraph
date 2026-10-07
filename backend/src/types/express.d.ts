import { AuthPayload } from '../models';

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload; // Set by authenticateJWT / يُضاف بعد التحقق من التوكن
    }
  }
}

export {};
