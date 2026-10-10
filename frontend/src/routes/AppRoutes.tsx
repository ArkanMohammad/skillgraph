import { Route, Routes } from 'react-router-dom';
import LandingPage from '../pages/LandingPage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import SelectGoalPage from '../pages/SelectGoalPage';
import AssessmentPage from '../pages/AssessmentPage';
import AssessmentQuizPage from '../pages/AssessmentQuizPage';
import AssessmentResultsPage from '../pages/AssessmentResultsPage';
import DashboardPage from '../pages/DashboardPage';
import MyGoalPage from '../pages/MyGoalPage';
import MySkillsPage from '../pages/MySkillsPage';
import SkillGraphPage from '../pages/SkillGraphPage';
import ProgressPage from '../pages/ProgressPage';
import ProfilePage from '../pages/ProfilePage';
import AppLayout from '../components/AppLayout';
import ProtectedRoute from './ProtectedRoute';
import RequireGoal from './RequireGoal';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<ProtectedRoute />}>
        {/* Logged in, goal selection (no sidebar) */}
        <Route path="/select-goal" element={<SelectGoalPage />} />

        {/* Logged in AND has a goal */}
        <Route element={<RequireGoal />}>
          <Route path="/assessment/skill/:skillId" element={<AssessmentQuizPage />} />
          <Route path="/assessment/results" element={<AssessmentResultsPage />} />

          {/* With sidebar */}
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/my-goal" element={<MyGoalPage />} />
            <Route path="/skill-graph" element={<SkillGraphPage />} />
            <Route path="/assessment" element={<AssessmentPage />} />
            <Route path="/my-skills" element={<MySkillsPage />} />
            <Route path="/progress" element={<ProgressPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}