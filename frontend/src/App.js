import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import DashboardLayout from './layouts/DashboardLayout';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Teachers from './pages/Teachers';
import Subjects from './pages/Subjects';
import Timetables from './pages/Timetables';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';
import GenerateTimetable from './pages/GenerateTimetable';
import Constraints from './pages/Constraints';
import Settings from './pages/Settings';
import Infrastructure from './pages/Infrastructure';

const DashboardSelector = () => {
  const { user } = useAuth();
  if (user?.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  if (user?.role === 'teacher') return <Navigate to="/teacher/dashboard" replace />;
  if (user?.role === 'student') return <Navigate to="/student/dashboard" replace />;
  return <Navigate to="/login" replace />;
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <Toaster position="top-right" reverseOrder={false} />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/login/:role" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* General Dashboard Redirect */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <DashboardSelector />
              </ProtectedRoute>
            } />

            {/* Role-Specific Dashboards */}
            <Route path="/admin/dashboard" element={
              <ProtectedRoute roles={['admin']}>
                <DashboardLayout>
                  <Dashboard />
                </DashboardLayout>
              </ProtectedRoute>
            } />

            <Route path="/teacher/dashboard" element={
              <ProtectedRoute roles={['teacher', 'admin']}>
                <DashboardLayout>
                  <TeacherDashboard />
                </DashboardLayout>
              </ProtectedRoute>
            } />

            <Route path="/student/dashboard" element={
              <ProtectedRoute roles={['student', 'admin']}>
                <DashboardLayout>
                  <StudentDashboard />
                </DashboardLayout>
              </ProtectedRoute>
            } />

            <Route path="/timetables" element={
              <ProtectedRoute roles={['admin', 'teacher', 'student']}>
                <DashboardLayout>
                  <Timetables />
                </DashboardLayout>
              </ProtectedRoute>
            } />

            <Route path="/my-schedule" element={
              <ProtectedRoute roles={['teacher', 'admin']}>
                <DashboardLayout>
                  <TeacherDashboard />
                </DashboardLayout>
              </ProtectedRoute>
            } />

            <Route path="/generate-timetable" element={
              <ProtectedRoute roles={['admin']}>
                <DashboardLayout>
                  <GenerateTimetable />
                </DashboardLayout>
              </ProtectedRoute>
            } />

            <Route path="/teachers" element={
              <ProtectedRoute roles={['admin']}>
                <DashboardLayout>
                  <Teachers />
                </DashboardLayout>
              </ProtectedRoute>
            } />

            <Route path="/subjects" element={
              <ProtectedRoute roles={['admin']}>
                <DashboardLayout>
                  <Subjects />
                </DashboardLayout>
              </ProtectedRoute>
            } />

            <Route path="/infrastructure" element={
              <ProtectedRoute roles={['admin']}>
                <DashboardLayout>
                  <Infrastructure />
                </DashboardLayout>
              </ProtectedRoute>
            } />

            <Route path="/settings" element={
              <ProtectedRoute roles={['admin', 'teacher']}>
                <DashboardLayout>
                  <Settings />
                </DashboardLayout>
              </ProtectedRoute>
            } />

            <Route path="/constraints" element={
              <ProtectedRoute roles={['admin']}>
                <DashboardLayout>
                  <Constraints />
                </DashboardLayout>
              </ProtectedRoute>
            } />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
