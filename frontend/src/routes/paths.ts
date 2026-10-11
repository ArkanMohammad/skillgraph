// Every address of the app in one place.
// Pages for a logged-in user live under /user, public pages stay at the top.
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
  profile: `${USER}/profile`,

  // Address of the quiz for one skill
  assessmentQuiz: (skillId: number | string) => `${USER}/assessment/skill/${skillId}`,
}