import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = () => {
  const { user } = useAuth();

  if (!user) {
    // If user is not logged in, redirect them to the login page
    return <Navigate to="/login" />;
  }

  // If user is logged in, render the child routes
  return <Outlet />;
};

export default ProtectedRoute;