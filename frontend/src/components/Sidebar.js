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
  FiCpu
} from 'react-icons/fi';

const Sidebar = ({ isOpen }) => {
  const { user } = useAuth();

  const links = [
    { name: 'Dashboard', path: '/', icon: <FiHome />, roles: ['admin', 'teacher', 'student'] },
    { name: 'My Schedule', path: '/my-schedule', icon: <FiUser />, roles: ['teacher', 'admin'] },
    { name: 'Class Schedules', path: '/', icon: <FiCalendar />, roles: ['student'] },
    { name: 'Timetables', path: '/timetables', icon: <FiCalendar />, roles: ['admin', 'teacher'] },
    { name: 'AI Generator', path: '/generate-timetable', icon: <FiCpu />, roles: ['admin'] },
    { name: 'Teachers', path: '/teachers', icon: <FiUsers />, roles: ['admin'] },
    { name: 'Subjects', path: '/subjects', icon: <FiBook />, roles: ['admin'] },
    { name: 'Rooms & Labs', path: '/infrastructure', icon: <FiBox />, roles: ['admin'] },
    { name: 'Settings', path: '/settings', icon: <FiSettings />, roles: ['admin', 'teacher'] },
  ];

  return (
    <div className={`${isOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-30 w-64 bg-secondary text-white transition duration-300 transform lg:translate-x-0 lg:static lg:inset-0`}>
      <div className="flex items-center justify-center mt-8 px-6">
        <span className="text-xl font-bold tracking-wider">AI TIMETABLE</span>
      </div>

      <nav className="mt-10 px-4">
        {links.filter(link => link.roles.includes(user?.role)).map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            className={({ isActive }) => 
              `flex items-center px-4 py-3 mb-2 transition-colors duration-200 rounded-lg ${
                isActive ? 'bg-primary text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            <span className="mr-3">{link.icon}</span>
            <span className="text-sm font-medium">{link.name}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
