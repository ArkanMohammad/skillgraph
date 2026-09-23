/**
 * نقطة تشغيل السيرفر: Middlewares عامة ومسار فحص الحالة
 * Server entry point: global middlewares and health check
 */
import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import routes from './routes';
import { errorHandler, notFound } from './middleware';

const app = express();

app.use(cors()); // Allow frontend requests / السماح للواجهة الأمامية بالوصول
app.use(express.json()); // Parse JSON request body / قراءة جسم الطلب كـ JSON

app.use(routes);

app.use(notFound);
app.use(errorHandler);

app.listen(env.port, () => {
  console.log(`SkillGraph يعمل على المنفذ ${env.port}`);
});
