/**
 * نقطة تشغيل السيرفر: Middlewares عامة ومسار فحص الحالة
 * Server entry point: global middlewares and health check
 */
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { seedGoals } from './config/seedData';
import authRoutes from './routes/authRoutes';
import goalRoutes from './routes/goalRoutes';
import graphRoutes from './routes/graphRoutes';
import assessmentRoutes from './routes/assessmentRoutes';
import { errorHandler, notFound } from './middleware';
import { ensureAssessmentSchema } from './config/ensureSchema';

const app = express();

// Any http://localhost:<port> is allowed while developing / أي بورت على localhost أثناء التطوير
const LOCALHOST_ORIGIN = /^http:\/\/localhost:\d+$/;

app.use(
  cors({
    // Cookies need an exact origin (not "*"), so we check it ourselves / الكوكيز تحتاج origin محدد
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // Postman, curl / أدوات بدون origin
      const allowed =
        origin === env.clientUrl || (!env.isProduction && LOCALHOST_ORIGIN.test(origin));
      callback(null, allowed);
    },
    credentials: true,
  })
);
app.use(express.json()); // Parse JSON request body / قراءة جسم الطلب كـ JSON
app.use(cookieParser()); // Read cookies (the login token) / قراءة الكوكيز

app.use('/api/auth', authRoutes); // Auth: /register /login /me /logout / مسارات التوثيق
app.use('/api/goals', goalRoutes); // Protected career goals / أهداف مهنية محمية
app.use('/api/graph', graphRoutes); // Skill graph for React Flow / مخطط المهارات
app.use('/api/assessments', assessmentRoutes); // Assessment & mastery / التقييم والتمكين

app.use(notFound);
app.use(errorHandler);

/** Seed then listen / إدخال البيانات ثم تشغيل السيرفر */
const start = async (): Promise<void> => {
  try {
    await ensureAssessmentSchema(); // Assessment tables if missing / جداول التقييم إن لزم
    await seedGoals();
    app.listen(env.port, () => {
      console.log(`SkillGraph يعمل على المنفذ ${env.port}`);
    });
  } catch (err) {
    console.error('Failed to start server / فشل إقلاع السيرفر:', err);
    process.exit(1);
  }
};

void start();