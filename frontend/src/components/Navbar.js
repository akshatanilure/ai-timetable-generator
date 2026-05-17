import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiLogOut, FiMenu, FiUser, FiChevronDown, FiPlus, FiGrid } from 'react-icons/fi';
import toast from 'react-hot-toast';

const Navbar = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      navigate('/');
    } catch (err) {
      toast.error('Logout failed');
    }
  };

  // If user is logged in, show the Dashboard Navbar
  if (user) {
    return (
      <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="flex items-center">
          <button onClick={toggleSidebar} className="text-gray-500 hover:text-indigo-600 focus:outline-none lg:hidden transition-colors">
            <FiMenu size={24} />
          </button>
          <div className="hidden lg:flex items-center ml-4 space-x-1 text-sm font-medium text-gray-500">
            <Link to="/dashboard" className="hover:text-indigo-600 px-3 py-2 rounded-md transition-colors">Dashboard</Link>
            <span className="text-gray-300">/</span>
            <span className="text-gray-900 px-3 py-2">Overview</span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center bg-gray-50 px-4 py-2 rounded-2xl border border-gray-100">
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-xs mr-3">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-gray-900 leading-none mb-1">{user.name}</span>
              <span className="text-[10px] font-semibold text-indigo-600 uppercase tracking-wider">{user.role}</span>
            </div>
          </div>
          
          <button 
            onClick={handleLogout}
            className="p-3 text-gray-400 hover:text-red-600 bg-gray-50 hover:bg-red-50 rounded-2xl transition-all duration-300 group"
            title="Logout"
          >
            <FiLogOut size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </header>
    );
  }

  // If guest, show the Landing Page Navbar
  return (
    <header className="flex items-center justify-between px-8 py-6 bg-transparent absolute top-0 left-0 right-0 z-50">
      <Link to="/" className="text-2xl font-black text-white flex items-center tracking-tighter">
        <span className="bg-teal-500 text-black px-2 py-1 rounded-lg mr-2">AI</span>
        TIMETABLE
      </Link>

      <nav className="hidden md:flex items-center space-x-8">
        <Link to="/" className="text-sm font-bold text-white hover:text-teal-400 transition-colors uppercase tracking-widest">Home</Link>
        <Link to="/about" className="text-sm font-bold text-white hover:text-teal-400 transition-colors uppercase tracking-widest">About</Link>
        
        {/* Login Dropdown */}
        <div className="relative group">
          <button className="flex items-center text-sm font-bold text-white group-hover:text-teal-400 transition-colors uppercase tracking-widest">
            Login <FiChevronDown className="ml-1" />
          </button>
          <div className="absolute right-0 mt-4 w-48 bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 overflow-hidden">
            <Link to="/login/admin" className="block px-6 py-4 text-sm text-gray-300 hover:bg-gray-800 hover:text-teal-400 transition-colors">Admin Login</Link>
            <Link to="/login/teacher" className="block px-6 py-4 text-sm text-gray-300 hover:bg-gray-800 hover:text-teal-400 transition-colors">Teacher Login</Link>
            <Link to="/login/student" className="block px-6 py-4 text-sm text-gray-300 hover:bg-gray-800 hover:text-teal-400 transition-colors">Student Login</Link>
          </div>
        </div>

        {/* Register Dropdown */}
        <div className="relative group">
          <button className="flex items-center text-sm font-bold text-white group-hover:text-teal-400 transition-colors uppercase tracking-widest">
            Register <FiChevronDown className="ml-1" />
          </button>
          <div className="absolute right-0 mt-4 w-48 bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 overflow-hidden">
            <Link to="/register?role=teacher" className="block px-6 py-4 text-sm text-gray-300 hover:bg-gray-800 hover:text-teal-400 transition-colors">Teacher Register</Link>
            <Link to="/register?role=student" className="block px-6 py-4 text-sm text-gray-300 hover:bg-gray-800 hover:text-teal-400 transition-colors">Student Register</Link>
          </div>
        </div>
      </nav>

      <button className="md:hidden text-white">
        <FiMenu size={24} />
      </button>
    </header>
  );
};

export default Navbar;
