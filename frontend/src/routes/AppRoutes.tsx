import { Routes, Route } from 'react-router-dom'

import LandingPage from '../pages/LandingPage'
import LoginPage from '../pages/LoginPage'
import RegisterPage from '../pages/RegisterPage'
import SelectGoalPage from '../pages/SelectGoalPage'
import AssessmentPage from '../pages/AssessmentPage'
import AssessmentResultsPage from '../pages/AssessmentResultsPage'
import AssessmentQuizPage from '../pages/AssessmentQuizPage'
import DashboardPage from '../pages/DashboardPage'
import MyGoalPage from '../pages/MyGoalPage'
import SkillGraphPage from '../pages/SkillGraphPage'
import ProgressPage from '../pages/ProgressPage'
import ProfilePage from '../pages/ProfilePage'

import AppLayout from '../components/AppLayout'
import ProtectedRoute from './ProtectedRoute'

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes - accessible without authentication */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected routes - require authentication */}
      <Route element={<ProtectedRoute />}>
        {/* Pages without the sidebar */}
        <Route path="/select-goal" element={<SelectGoalPage />} />
        <Route path="/assessment/skill/:skillId" element={<AssessmentQuizPage />} />
        <Route path="/assessment/results" element={<AssessmentResultsPage />} />

        {/* Pages with the sidebar */}
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/my-goal" element={<MyGoalPage />} />
          <Route path="/skill-graph" element={<SkillGraphPage />} />
          <Route path="/assessment" element={<AssessmentPage />} />
          <Route path="/progress" element={<ProgressPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default AppRoutes