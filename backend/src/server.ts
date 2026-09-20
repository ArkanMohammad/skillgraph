/**
 * نقطة تشغيل السيرفر: Middlewares عامة ومسار فحص الحالة
 */
import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import routes from './routes';
import { errorHandler, notFound } from './middleware';

const app = express();

app.use(cors()); // السماح للواجهة الأمامية بالوصول
app.use(express.json()); // قراءة جسم الطلب كـ JSON

app.use(routes);

app.use(notFound);
app.use(errorHandler);

app.listen(env.port, () => {
  console.log(`SkillGraph يعمل على المنفذ ${env.port}`);
});
