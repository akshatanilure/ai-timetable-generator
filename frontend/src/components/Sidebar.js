import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  FiHome, 
  FiCalendar, 
  FiUsers, 
  FiBook, 
  FiSettings,
  FiBox,
  FiUser,
  FiCpu,
  FiSliders
} from 'react-icons/fi';

const Sidebar = ({ isOpen }) => {
  const { user } = useAuth();

  const getDashboardPath = () => {
    if (user?.role === 'admin') return '/admin/dashboard';
    if (user?.role === 'teacher') return '/teacher/dashboard';
    if (user?.role === 'student') return '/student/dashboard';
    return '/dashboard';
  };

  const links = [
    { name: 'Dashboard', path: getDashboardPath(), icon: <FiHome />, roles: ['admin', 'teacher', 'student'] },
    { name: 'My Schedule', path: '/my-schedule', icon: <FiUser />, roles: ['teacher'] },
    { name: 'Timetables', path: '/timetables', icon: <FiCalendar />, roles: ['admin', 'teacher', 'student'] },
    { name: 'AI Generator', path: '/generate-timetable', icon: <FiCpu />, roles: ['admin'] },
    { name: 'Teachers', path: '/teachers', icon: <FiUsers />, roles: ['admin'] },
    { name: 'Subjects', path: '/subjects', icon: <FiBook />, roles: ['admin'] },
    { name: 'Rooms & Labs', path: '/infrastructure', icon: <FiBox />, roles: ['admin'] },
    { name: 'Constraints', path: '/constraints', icon: <FiSliders />, roles: ['admin'] },
    { name: 'Settings', path: '/settings', icon: <FiSettings />, roles: ['admin', 'teacher'] },
  ];

  return (
    <div className={`${isOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 text-slate-800 transition duration-300 transform lg:translate-x-0 lg:static lg:inset-0 print:hidden`}>
      <div className="flex items-center justify-center mt-8 px-6">
        <span className="text-2xl font-black tracking-wider text-slate-900">
          <span className="text-indigo-600">AI</span> TIMETABLE
        </span>
      </div>

      <nav className="mt-10 px-4">
        {links.filter(link => link.roles.includes(user?.role)).map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            className={({ isActive }) => 
              `flex items-center px-4 py-3 mb-2 transition-all duration-200 rounded-xl ${
                isActive 
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/25 font-semibold' 
                  : 'text-slate-600 hover:bg-indigo-50/80 hover:text-indigo-600 font-medium'
              }`
            }
          >
            <span className="mr-3 text-lg">{link.icon}</span>
            <span className="text-sm">{link.name}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
