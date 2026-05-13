import React from 'react';
import { useAuth } from '../context/AuthContext';
import { FiLogOut, FiMenu, FiUser } from 'react-icons/fi';

const Navbar = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white border-b-2 border-gray-100">
      <div className="flex items-center">
        <button onClick={toggleSidebar} className="text-gray-500 focus:outline-none lg:hidden">
          <FiMenu size={24} />
        </button>
      </div>

      <div className="flex items-center">
        <div className="flex items-center mr-4">
          <FiUser className="text-gray-500 mr-2" />
          <span className="text-sm font-medium text-gray-700">{user?.name}</span>
          <span className="ml-2 px-2 py-0.5 text-xs font-semibold text-primary bg-indigo-50 rounded-full uppercase">
            {user?.role}
          </span>
        </div>
        <button 
          onClick={logout}
          className="p-2 text-gray-500 hover:text-red-600 transition-colors"
          title="Logout"
        >
          <FiLogOut size={20} />
        </button>
      </div>
    </header>
  );
};

export default Navbar;
