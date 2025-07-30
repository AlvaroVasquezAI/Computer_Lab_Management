import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Import Layouts and Route Guards
import PageLayout from './components/layout/PageLayout';
import ProtectedRoute from './utils/ProtectedRoute';

// Import all Page Components
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/Auth/LoginPage';
import SignUpPage from './pages/Auth/SignUpPage';
import ForgotPasswordPage from './pages/Auth/ForgotPasswordPage';
import HomePage from './pages/HomePage';
import WorkspacePage from './pages/WorkspacePage';
import StatusPage from './pages/StatusPage';
import AdminPage from './pages/AdminPage';

function App() {
  return (
    <Router>
      <Routes>
        {/* --- Public Routes --- */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        {/* --- Protected Routes --- */}
        <Route element={<ProtectedRoute />}>
          <Route element={<PageLayout />}>
            <Route path="/home" element={<HomePage />} />
            <Route path="/workspace" element={<WorkspacePage />} />
            <Route path="/status" element={<StatusPage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;