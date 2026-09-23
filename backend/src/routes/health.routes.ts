/**
 * مسار فحص الحالة GET /health
 * Health check route: GET /health
 */
import { Router } from 'express';
import { healthCheck } from '../controllers/health.controller';

const router = Router();

router.get('/health', healthCheck);

export default router;
