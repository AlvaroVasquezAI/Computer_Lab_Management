import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './utils/ProtectedRoute';
import PageLayout from './components/layout/PageLayout'; 

// Public Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/Auth/LoginPage';
import ForgotPasswordPage from './pages/Auth/ForgotPasswordPage';
import SignUpPage from './pages/Auth/SignUpPage';

// Protected Pages
import HomePage from './pages/HomePage';
import StatusPage from './pages/StatusPage';
import WorkspacePage from './pages/WorkspacePage';
import AdminPage from './pages/AdminPage'; // For admins

function App() {
  return (
    <Routes>
      {/* Publicly accessible routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignUpPage />} /> 
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* Protected routes are nested inside this special route */}
      <Route element={<ProtectedRoute />}>
        {/* The PageLayout now wraps all the protected pages */}
        <Route element={<PageLayout />}> 
          <Route path="/home" element={<HomePage />} />
          <Route path="/status" element={<StatusPage />} />
          <Route path="/workspace" element={<WorkspacePage />} />
          <Route path="/admin" element={<AdminPage />} />
          {/* Add all other protected routes here */}
        </Route>
      </Route>
    </Routes>
  );
}

export default App;