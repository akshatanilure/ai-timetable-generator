import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const getRoleDashboard = (userRole) => {
  if (userRole === 'admin') return '/admin/dashboard';
  if (userRole === 'teacher') return '/teacher/dashboard';
  if (userRole === 'student') return '/student/dashboard';
  return '/login';
};

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingSpinner />;

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to={getRoleDashboard(user.role)} replace />;
  }

  return children;
};

export default ProtectedRoute;
