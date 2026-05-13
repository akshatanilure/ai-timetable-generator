import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import DashboardLayout from './layouts/DashboardLayout';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Teachers from './pages/Teachers';
import Subjects from './pages/Subjects';
import Timetables from './pages/Timetables';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';
import GenerateTimetable from './pages/GenerateTimetable';

// Placeholder Pages
const Infrastructure = () => (
  <div className="bg-white p-12 rounded-3xl shadow-sm border border-dashed border-gray-200 text-center">
    <h2 className="text-2xl font-bold text-gray-700">Infrastructure Management</h2>
    <p className="text-gray-400 mt-2">Module coming soon: Manage classrooms, lab equipment, and department blocks.</p>
  </div>
);

const Settings = () => (
  <div className="bg-white p-12 rounded-3xl shadow-sm border border-dashed border-gray-200 text-center">
    <h2 className="text-2xl font-bold text-gray-700">System Settings</h2>
    <p className="text-gray-400 mt-2">Manage academic years, semester dates, and application preferences.</p>
  </div>
);

const DashboardSelector = () => {
  const { user } = useAuth();
  if (user?.role === 'admin') return <Dashboard />;
  if (user?.role === 'teacher') return <TeacherDashboard />;
  return <StudentDashboard />;
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <Toaster position="top-right" reverseOrder={false} />
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Role-Based Protected Routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <DashboardSelector />
                </DashboardLayout>
              </ProtectedRoute>
            } />

            <Route path="/timetables" element={
              <ProtectedRoute>
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

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
