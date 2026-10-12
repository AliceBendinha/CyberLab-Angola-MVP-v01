import { BrowserRouter, Route, Routes } from 'react-router-dom';
import LandingPage from './pages/landing-page';
import LoginPage from './pages/login-page';
import RegisterPage from './pages/register-page';
import NotFoundPage from './pages/not-found-page';
import ProtectedRoute from './components/protected-route';

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard" element={<ProtectedRoute />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
