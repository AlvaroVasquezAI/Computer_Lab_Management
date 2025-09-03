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
import AnnouncementsPage from './pages/AnnouncementsPage';
import AdminPage from './pages/AdminPage';
import RegisterPracticePage from './pages/RegisterPracticePage';
import ConsultPracticesPage from './pages/ConsultPracticesPage';
import VisualizeActivitiesPage from './pages/VisualizeActivitiesPage';
import EditPracticePage from './pages/EditPracticePage';
import TeacherDetailPage from './pages/TeacherDetailPage';
import ChatPage from './pages/ChatPage';

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
            <Route path="/announcements" element={<AnnouncementsPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/admin/teacher/:teacherId" element={<TeacherDetailPage />} />
            <Route path="/admin/edit-teacher/:teacherId" element={<SignUpPage isEditMode={true} />} /> 
            <Route path="/admin/edit-practice/:practiceId" element={<EditPracticePage isAdminMode={true} />} />
            <Route path="/workspace/register-practice" element={<RegisterPracticePage />} />
            <Route path="/workspace/consult-practices" element={<ConsultPracticesPage />} />
            <Route path="/workspace/visualize-activities" element={<VisualizeActivitiesPage />} />
            <Route path="/workspace/edit-practice/:practiceId" element={<EditPracticePage />} />
            <Route path="/chat" element={<ChatPage />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;