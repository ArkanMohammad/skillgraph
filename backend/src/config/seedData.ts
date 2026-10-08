/**
 * تغذية الأهداف المهنية السبعة عند الإقلاع
 * Seed the seven career goals on startup
 */
import { query } from './db';

const CAREER_GOALS = [
  { name: 'Full Stack Developer', description: 'Build complete web apps / بناء تطبيقات ويب كاملة' },
  { name: 'Frontend Developer', description: 'Build user interfaces / بناء واجهات المستخدم' },
  { name: 'Backend Developer', description: 'Build server-side systems / بناء أنظمة الخادم' },
  { name: 'Data Analyst', description: 'Analyze and visualize data / تحليل البيانات وعرضها' },
  { name: 'Cybersecurity Specialist', description: 'Protect systems and data / حماية الأنظمة والبيانات' },
  { name: 'UI/UX Designer', description: 'Design usable interfaces / تصميم واجهات سهلة الاستخدام' },
  { name: 'DevOps Engineer', description: 'Automate build and deploy / أتمتة البناء والنشر' },
] as const;

/** Insert goals if missing / إدخال الأهداف إن لم تكن موجودة */
export const seedGoals = async (): Promise<void> => {
  await query(
    `INSERT INTO goals (name, description)
     VALUES
       ($1, $2),
       ($3, $4),
       ($5, $6),
       ($7, $8),
       ($9, $10),
       ($11, $12),
       ($13, $14)
     ON CONFLICT (name) DO NOTHING`, // Skip duplicates / تجاهل التكرار
    CAREER_GOALS.flatMap((goal) => [goal.name, goal.description])
  );

  console.log('Career goals seeded / تم إدخال الأهداف المهنية');
};
