import React from 'react';
import Dashboard from '../pages/Dashboard';
import TeacherDashboard from '../pages/TeacherDashboard';
import StudentDashboard from '../pages/StudentDashboard';
import Teachers from '../pages/Teachers';
import Subjects from '../pages/Subjects';
import Timetables from '../pages/Timetables';
import GenerateTimetable from '../pages/GenerateTimetable';
import Constraints from '../pages/Admin/Constraints';
import ConflictReports from '../pages/Admin/ConflictReports';

export const adminRoutes = [
  { path: '/dashboard', component: Dashboard },
  { path: '/teachers', component: Teachers },
  { path: '/subjects', component: Subjects },
  { path: '/generate-timetable', component: GenerateTimetable },
  { path: '/constraints', component: Constraints },
  { path: '/conflict-reports', component: ConflictReports },
  { path: '/timetables', component: Timetables },
];

export const teacherRoutes = [
  { path: '/dashboard', component: TeacherDashboard },
  { path: '/my-schedule', component: TeacherDashboard },
  { path: '/timetables', component: Timetables },
];

export const studentRoutes = [
  { path: '/dashboard', component: StudentDashboard },
  { path: '/timetables', component: Timetables },
];
