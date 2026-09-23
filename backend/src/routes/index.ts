/**
 * تجميع مسارات الواجهة البرمجية
 * Collects all API routes in one place
 */
import { Router } from 'express';
import healthRoutes from './health.routes';

const router = Router();

router.use(healthRoutes);

export default router;
