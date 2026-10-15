import { Navigate, Route, Routes } from 'react-router-dom'
import LandingPage from '../pages/LandingPage'
import LoginPage from '../pages/LoginPage'
import RegisterPage from '../pages/RegisterPage'
import PlansPage from '../pages/PlansPage'
import SelectGoalPage from '../pages/SelectGoalPage'
import AssessmentPage from '../pages/AssessmentPage'
import AssessmentQuizPage from '../pages/AssessmentQuizPage'
import AssessmentResultsPage from '../pages/AssessmentResultsPage'
import DashboardPage from '../pages/DashboardPage'
import MyGoalPage from '../pages/MyGoalPage'
import MySkillsPage from '../pages/MySkillsPage'
import SkillGraphPage from '../pages/SkillGraphPage'
import ProgressPage from '../pages/ProgressPage'
import MyProfilePage from '../pages/MyProfilePage'
import ProjectsPage from '../pages/ProjectsPage'
import MentorDeskPage from '../pages/MentorDeskPage'
import VerifyPage from '../pages/VerifyPage'
import AdminPage from '../pages/AdminPage'
import AppLayout from '../components/AppLayout'
import ProtectedRoute from './ProtectedRoute'
import RequireGoal from './RequireGoal'
import RequireAdmin from './RequireAdmin'
import RequireMentor from './RequireMentor'

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public: the landing page is the first page of the site */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/plans" element={<PlansPage />} />

      {/* Public: anybody can check a recommendation code */}
      <Route path="/verify" element={<VerifyPage />} />
      <Route path="/verify/:code" element={<VerifyPage />} />

      {/* Everything for logged-in users lives under /user */}
      <Route path="/user" element={<ProtectedRoute />}>
        <Route index element={<Navigate to="dashboard" replace />} />

        {/* Logged in, goal selection (no sidebar) */}
        <Route path="select-goal" element={<SelectGoalPage />} />

        {/* Logged in AND has a goal */}
        <Route element={<RequireGoal />}>
          <Route path="assessment/skill/:skillId" element={<AssessmentQuizPage />} />
          <Route path="assessment/results" element={<AssessmentResultsPage />} />

          {/* With sidebar */}
          <Route element={<AppLayout />}>
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="my-goal" element={<MyGoalPage />} />
            <Route path="skill-graph" element={<SkillGraphPage />} />
            <Route path="assessment" element={<AssessmentPage />} />
            <Route path="my-skills" element={<MySkillsPage />} />
            <Route path="progress" element={<ProgressPage />} />
            <Route path="my-profile" element={<MyProfilePage />} />
            <Route path="projects" element={<ProjectsPage />} />

            {/* Mentors only: other users are sent back to the dashboard */}
            <Route element={<RequireMentor />}>
              <Route path="mentor-desk" element={<MentorDeskPage />} />
            </Route>

            {/* Admins only: other users are sent back to the dashboard */}
            <Route element={<RequireAdmin />}>
              <Route path="admin" element={<AdminPage />} />
            </Route>
          </Route>
        </Route>
      </Route>

      {/* Any unknown address goes back to the landing page */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}