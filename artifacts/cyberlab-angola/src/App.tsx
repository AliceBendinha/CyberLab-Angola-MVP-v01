import { BrowserRouter, Route, Routes } from 'react-router-dom';
import LandingPage from './pages/landing-page';
import LoginPage from './pages/login-page';
import RegisterPage from './pages/register-page';
import NotFoundPage from './pages/not-found-page';
import ProtectedRoute from './components/protected-route';
import {
  DashboardLearningPage,
  DiagnosticPage,
  DiagnosticResultsPage,
  LearningModulePage,
  ModulesPage,
  MissionPage,
  ProgressPage,
} from './pages/learning-pages';

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardLearningPage /></ProtectedRoute>} />
        <Route path="/modules" element={<ProtectedRoute><ModulesPage /></ProtectedRoute>} />
        <Route path="/modules/:slug" element={<ProtectedRoute><LearningModulePage /></ProtectedRoute>} />
        <Route path="/missions/:id" element={<ProtectedRoute><MissionPage /></ProtectedRoute>} />
        <Route path="/diagnostic" element={<ProtectedRoute><DiagnosticPage /></ProtectedRoute>} />
        <Route path="/diagnostic/results/:attemptId" element={<ProtectedRoute><DiagnosticResultsPage /></ProtectedRoute>} />
        <Route path="/progress" element={<ProtectedRoute><ProgressPage /></ProtectedRoute>} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
