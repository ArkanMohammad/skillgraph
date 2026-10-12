// Every address of the app in one place.
// Logged-in pages live under /user, public pages stay at the root.
const USER = '/user'

export const PATHS = {
  home: '/',
  login: '/login',
  register: '/register',

  selectGoal: `${USER}/select-goal`,
  dashboard: `${USER}/dashboard`,
  myGoal: `${USER}/my-goal`,
  skillGraph: `${USER}/skill-graph`,
  assessments: `${USER}/assessment`,
  assessmentResults: `${USER}/assessment/results`,
  mySkills: `${USER}/my-skills`,
  progress: `${USER}/progress`,
  myProfile: `${USER}/my-profile`,
  admin: `${USER}/admin`,

  assessmentQuiz: (skillId: number | string) => `${USER}/assessment/skill/${skillId}`,
}