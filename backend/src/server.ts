/**
 * نقطة تشغيل السيرفر: Middlewares عامة ومسار فحص الحالة
 * Server entry point: global middlewares and health check
 */
import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import { seedGoals } from './config/seedData';
import routes from './routes';
import authRoutes from './routes/authRoutes';
import goalRoutes from './routes/goalRoutes';
import { errorHandler, notFound } from './middleware';

const app = express();

app.use(cors()); // Allow frontend requests / السماح للواجهة الأمامية بالوصول
app.use(express.json()); // Parse JSON request body / قراءة جسم الطلب كـ JSON

app.use('/api/auth', authRoutes); // Auth: /register and /login / مسارات التوثيق
app.use('/api/goals', goalRoutes); // Protected career goals / أهداف مهنية محمية
app.use(routes);

app.use(notFound);
app.use(errorHandler);

/** Seed then listen / إدخال البيانات ثم تشغيل السيرفر */
const start = async (): Promise<void> => {
  try {
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
